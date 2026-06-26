from typing import Dict, Any

def calculate_scores(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes multidimensional credit assessment scores based on BRD V2.0.
    """
    # 1. Knockout Check Inputs
    cibil_score = features.get("cibil_score", 700)
    debt_to_income = features.get("debt_to_income", 0.0)
    cheque_bounces_3m = features.get("cheque_bounces_3m", 0)
    gst_filing_delay_days = features.get("gst_filing_delay_days", 0)

    # 2. Hard Knockout Checks
    knockout_checks = [
        {
            "check_name": "CIBIL Threshold",
            "status": "PASS" if cibil_score >= 680 else "FAIL",
            "value": f"{cibil_score} (Limit: 680)"
        },
        {
            "check_name": "Debt-to-Income",
            "status": "PASS" if debt_to_income <= 50.0 else "FAIL",
            "value": f"{round(debt_to_income, 1)}% (Limit: 50%)"
        },
        {
            "check_name": "Cheque Bounces",
            "status": "PASS" if cheque_bounces_3m <= 2 else "FAIL",
            "value": f"{cheque_bounces_3m} bounce(s) (Limit: <=2)"
        },
        {
            "check_name": "GST Delay Check",
            "status": "PASS" if gst_filing_delay_days <= 60 else "FAIL",
            "value": f"{gst_filing_delay_days} day(s) (Limit: 60)"
        }
    ]

    is_knocked_out = any(check["status"] == "FAIL" for check in knockout_checks)
    knockout_reasons = []
    if cibil_score < 680:
        knockout_reasons.append("Promoter CIBIL score is below bank threshold (680).")
    if debt_to_income > 50.0:
        knockout_reasons.append("Leverage exceeds maximum permissible limits (DTI > 50%).")
    if cheque_bounces_3m > 2:
        knockout_reasons.append("Excessive cheque/ECS bounces detected in bank statement.")
    if gst_filing_delay_days > 60:
        knockout_reasons.append("Severe GST tax filing delay (> 60 days overdue).")

    # 3. Component score calculations
    # 3.1 Revenue Health
    growth_factor = min(100.0, max(0.0, 50.0 + (features.get("revenue_growth", 0.0) * 2.0)))
    revenue_score = int(0.6 * features.get("revenue_stability", 50.0) + 0.4 * growth_factor)
    revenue_score = min(100, max(0, revenue_score))

    # 3.2 Cash Flow Health & Deductions
    cash_flow_base = int(0.5 * features.get("cash_flow_stability", 50.0) + 0.5 * features.get("liquidity_score", 50.0))
    bounce_penalty = 0
    score_deductions = []
    if cheque_bounces_3m == 1:
        bounce_penalty = 10
        score_deductions.append({
            "component": "Cash Flow Score",
            "deduction": -10,
            "reason": "1 cheque/ECS bounce detected in last 3 months"
        })
    elif cheque_bounces_3m == 2:
        bounce_penalty = 25
        score_deductions.append({
            "component": "Cash Flow Score",
            "deduction": -25,
            "reason": "2 cheque/ECS bounces detected in last 3 months"
        })
    elif cheque_bounces_3m > 2:
        bounce_penalty = 50 # High penalty fallback
        score_deductions.append({
            "component": "Cash Flow Score",
            "deduction": -50,
            "reason": f"Excessive bounces ({cheque_bounces_3m}) detected (Triggered Knockout)"
        })
    cash_flow_score = max(0, min(100, cash_flow_base - bounce_penalty))

    # 3.3 Tax Compliance Score & Deductions
    compliance_base = int(features.get("compliance_score", 0.0))
    compliance_ratio = features.get("gst_reconciliation_ratio", 1.0)
    ratio_penalty = 0
    if compliance_ratio < 0.85:
        ratio_penalty = 30
        score_deductions.append({
            "component": "Tax Compliance Score",
            "deduction": -30,
            "reason": f"GST Reconciliation Variance {round((1.0 - compliance_ratio)*100, 1)}% exceeds 15% limit"
        })
    elif compliance_ratio < 0.95:
        ratio_penalty = 10
        score_deductions.append({
            "component": "Tax Compliance Score",
            "deduction": -10,
            "reason": f"GST Reconciliation Variance {round((1.0 - compliance_ratio)*100, 1)}% matches between 5% and 15%"
        })
    compliance_score = max(0, min(100, compliance_base - ratio_penalty))

    # 3.4 Business Stability & Calibration
    stability_base = 0.5 * features.get("credit_behavior", 100.0) + 0.5 * features.get("workforce_stability", 100.0)
    debt_penalty = min(50.0, debt_to_income * 1.5)
    stability_score_pre = stability_base - debt_penalty

    # Peer Benchmarking Calibration
    rg = features.get("revenue_growth", 0.0) - features.get("industry_growth_rate", 10.0)
    peer_adjustment = 0
    if rg > 10.0:
        peer_adjustment = 5
    elif rg < -10.0:
        peer_adjustment = -10
    stability_score = max(0, min(100, int(stability_score_pre + peer_adjustment)))

    # For compatibility, also generate a growth_score
    emp_growth_factor = min(100.0, max(0.0, 50.0 + (features.get("employee_growth", 0.0) * 3.0)))
    growth_score = max(0, min(100, int(0.5 * growth_factor + 0.5 * emp_growth_factor)))

    # 4. Overall Weighted Score
    overall_score = int(
        0.25 * revenue_score +
        0.30 * cash_flow_score +
        0.25 * compliance_score +
        0.20 * stability_score
    )
    overall_score = min(100, max(0, overall_score))

    # Override if Knocked Out
    if is_knocked_out:
        overall_score = 0
        risk_category = "REJECTED"
    else:
        if overall_score >= 80:
            risk_category = "Low"
        elif overall_score >= 50:
            risk_category = "Medium"
        else:
            risk_category = "High"

    # 5. Data Confidence Score
    data_points = 0
    if features.get("total_sales", 0.0) > 0: data_points += 1
    if features.get("avg_monthly_volume", 0.0) > 0: data_points += 1
    if features.get("avg_payroll", 0.0) > 0: data_points += 1
    if features.get("liquidity_score", 0.0) > 0: data_points += 1
    confidence_score = int((data_points / 4) * 100)
    confidence_score = min(100, max(40, confidence_score))

    # 6. DSCR Eligibility Solver
    total_sales = features.get("total_sales", 0.0)
    total_purchases = features.get("total_purchases", 0.0)
    ncm = (total_sales - total_purchases) / total_sales if total_sales > 0 else 0.10
    ncm = max(0.05, min(0.25, ncm))

    ams = features.get("avg_monthly_sales", total_sales / 12.0)
    existing_emi = features.get("avg_existing_emi", 0.0)
    fmcf = (ams * ncm) - existing_emi

    # Standard Amortization Solver (24 months, 14% p.a.)
    r_monthly = 0.14 / 12.0
    n_months = 24
    amortization_factor = r_monthly * ((1.0 + r_monthly) ** n_months) / (((1.0 + r_monthly) ** n_months) - 1.0)

    # Solve DSCR >= 1.25:
    # DSCR = (FMCF + ExistingEMI) / (ProposedEMI + ExistingEMI) >= 1.25
    # (ams * ncm) / (ProposedEMI + ExistingEMI) >= 1.25
    # ProposedEMI + ExistingEMI <= (ams * ncm) / 1.25
    # ProposedEMI <= (ams * ncm / 1.25) - ExistingEMI
    max_proposed_emi = (ams * ncm / 1.25) - existing_emi

    if max_proposed_emi <= 0 or is_knocked_out:
        loan_amount = 0.0
        calculated_dscr = 0.0
    else:
        raw_loan = max_proposed_emi / amortization_factor
        # Cap at 3x average monthly sales for safety limit
        loan_amount = min(raw_loan, ams * 3.0)
        proposed_emi = loan_amount * amortization_factor
        calculated_dscr = (fmcf + existing_emi) / (proposed_emi + existing_emi) if (proposed_emi + existing_emi) > 0 else 0.0

    # 7. Format Audit Trail
    audit_trail = {
        "knockout_checks": knockout_checks,
        "financial_evidence": {
            "estimated_operating_margin": f"{round(ncm * 100, 1)}%",
            "debt_service_coverage_ratio": f"{round(calculated_dscr, 2)}x (Proposed EMI of ₹{round(loan_amount * amortization_factor):,} on loan of ₹{round(loan_amount):,} is {'viable' if calculated_dscr >= 1.25 else 'unviable'})" if loan_amount > 0 else "₹0.00 eligibility (Existing EMIs consume free cash flow)",
            "gst_reconciliation_variance": f"{round(compliance_ratio * 100, 1)}% match between GSTR-1 and GSTR-3B",
            "peer_comparison": f"Outperforming sector average growth by +{round(rg, 1)}%" if rg >= 0 else f"Underperforming sector average growth by {round(abs(rg), 1)}%"
        },
        "score_deductions": score_deductions
    }

    return {
        "overall_score": overall_score,
        "revenue_score": revenue_score,
        "cash_flow_score": cash_flow_score,
        "compliance_score": compliance_score,
        "stability_score": stability_score,
        "growth_score": growth_score,
        "risk_category": risk_category,
        "confidence_score": confidence_score,
        "loan_amount": float(round(loan_amount, 2)),
        "audit_trail": audit_trail
    }
