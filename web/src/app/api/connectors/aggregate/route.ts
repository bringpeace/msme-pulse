import { NextResponse } from 'next/server';
import { 
  saveGstSummary, 
  saveUpiSummary, 
  saveAaSummary, 
  saveEpfoSummary, 
  saveFinancialHealthCard,
  saveRecommendations 
} from '@/lib/db';
import { mockProfiles } from '@/lib/mockConnectorData';

// Fallback Javascript scoring function in case the Python FastAPI scoring engine is unreachable
function calculateScoreFallback(raw_data: any) {
  // Inputs matching profile fields or default fallbacks
  const cibil_score = raw_data.cibil_score !== undefined ? raw_data.cibil_score : 700;
  const cheque_bounces_3m = raw_data.cheque_bounces_3m !== undefined ? raw_data.cheque_bounces_3m : 0;
  const gst_filing_delay_days = raw_data.gst_filing_delay_days !== undefined ? raw_data.gst_filing_delay_days : 0;
  const industry_growth_rate = raw_data.industry_growth_rate !== undefined ? raw_data.industry_growth_rate : 10.0;

  // GST Features & Scoring
  const gst = raw_data.gst || [];
  const compliance_base = (gst.filter((g: any) => g.gst_filing_status && g.gst_filing_status.toLowerCase() === 'filed').length / Math.max(1, gst.length)) * 100;
  
  let salesList = gst.map((g: any) => g.monthly_sales);
  let purchasesList = gst.map((g: any) => g.monthly_purchases || 0);
  let total_sales = salesList.reduce((a: number, b: number) => a + b, 0);
  let total_purchases = purchasesList.reduce((a: number, b: number) => a + b, 0);
  let avgSales = total_sales / Math.max(1, gst.length);
  
  let mom_growth = 0;
  if (salesList.length > 1) {
    let growthSums = 0;
    for (let i = 1; i < salesList.length; i++) {
      let prev = salesList[i-1];
      if (prev > 0) growthSums += (salesList[i] - prev) / prev * 100;
    }
    mom_growth = growthSums / (salesList.length - 1);
  }
  
  let revenue_stability = 75;
  if (salesList.length > 0) {
    let mean = total_sales / salesList.length;
    let variance = salesList.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / salesList.length;
    let std = Math.sqrt(variance);
    revenue_stability = Math.max(0, 100 - (mean > 0 ? (std / mean) * 100 : 0));
  }
  
  // UPI
  const upi = raw_data.upi || [];
  let credits = upi.map((u: any) => u.total_credits);
  let debits = upi.map((u: any) => u.total_debits);
  let cash_flow_stability = 70;
  
  // AA
  const aa = raw_data.aa || [];
  let existing_emi = aa.length > 0 ? aa.reduce((a: number, b: any) => a + (b.existing_emi || 0), 0) / aa.length : 0;
  let total_credits = aa.reduce((a: number, b: any) => a + b.monthly_credits, 0);
  let debt_to_income = total_credits > 0 ? (existing_emi * aa.length / total_credits) * 100 : 0;
  let credit_behavior = aa.length > 0 ? (aa.filter((a: any) => a.loan_repayment_status.toLowerCase() === 'on-time').length / aa.length) * 100 : 100;
  let liquidity_score = 65;
  
  // EPFO
  const epfo = raw_data.epfo || [];
  let employee_growth = 0;
  if (epfo.length > 1 && epfo[0].employee_count > 0) {
    employee_growth = ((epfo[epfo.length - 1].employee_count - epfo[0].employee_count) / epfo[0].employee_count) * 100;
  }
  let workforce_stability = 100;

  // GST Reconciliation Ratio
  let gstr1_sum = gst.reduce((acc: number, val: any) => acc + (val.gstr1_sales || val.monthly_sales), 0);
  let gstr3b_sum = gst.reduce((acc: number, val: any) => acc + (val.gstr3b_sales || val.monthly_sales), 0);
  let compliance_ratio = gstr1_sum > 0 ? gstr3b_sum / gstr1_sum : 1.0;

  // 1. Knockout Checks
  const knockout_checks = [
    {
      check_name: "CIBIL Threshold",
      status: cibil_score >= 680 ? "PASS" : "FAIL",
      value: `${cibil_score} (Limit: 680)`
    },
    {
      check_name: "Debt-to-Income",
      status: debt_to_income <= 50.0 ? "PASS" : "FAIL",
      value: `${debt_to_income.toFixed(1)}% (Limit: 50%)`
    },
    {
      check_name: "Cheque Bounces",
      status: cheque_bounces_3m <= 2 ? "PASS" : "FAIL",
      value: `${cheque_bounces_3m} bounce(s) (Limit: <=2)`
    },
    {
      check_name: "GST Delay Check",
      status: gst_filing_delay_days <= 60 ? "PASS" : "FAIL",
      value: `${gst_filing_delay_days} day(s) (Limit: 60)`
    }
  ];

  const is_knocked_out = knockout_checks.some(c => c.status === "FAIL");

  // 2. Component Scoring Math matching Python V2.0
  let growth_factor = Math.min(100.0, Math.max(0.0, 50.0 + (mom_growth * 2.0)));
  let revenue_score = Math.round(0.6 * revenue_stability + 0.4 * growth_factor);
  revenue_score = Math.min(100, Math.max(0, revenue_score));
  
  // Cash Flow Score
  let cash_flow_base = Math.round(0.5 * cash_flow_stability + 0.5 * liquidity_score);
  let bounce_penalty = cheque_bounces_3m === 1 ? 10 : cheque_bounces_3m === 2 ? 25 : cheque_bounces_3m > 2 ? 50 : 0;
  let cash_flow_score = Math.max(0, Math.min(100, cash_flow_base - bounce_penalty));

  // Compliance Score
  let ratio_penalty = compliance_ratio < 0.85 ? 30 : compliance_ratio < 0.95 ? 10 : 0;
  let compliance_score = Math.max(0, Math.min(100, Math.round(compliance_base) - ratio_penalty));

  // Stability Score
  let stability_base = 0.5 * credit_behavior + 0.5 * workforce_stability;
  let debt_penalty = Math.min(50.0, debt_to_income * 1.5);
  let stability_score_pre = stability_base - debt_penalty;
  let rg = mom_growth - industry_growth_rate;
  let peer_adjustment = rg > 10.0 ? 5 : rg < -10.0 ? -10 : 0;
  let stability_score = Math.max(0, Math.min(100, Math.round(stability_score_pre + peer_adjustment)));

  // Overall Score (Weighted)
  let overall_score = Math.round(0.25 * revenue_score + 0.30 * cash_flow_score + 0.25 * compliance_score + 0.20 * stability_score);
  overall_score = Math.min(100, Math.max(0, overall_score));

  let risk_category = 'Medium';
  if (is_knocked_out) {
    overall_score = 0;
    risk_category = 'REJECTED';
  } else {
    if (overall_score >= 80) risk_category = 'Low';
    else if (overall_score < 50) risk_category = 'High';
  }
  
  let confidence_score = 85;

  // 3. DSCR Loan Solver
  let ncm = total_sales > 0 ? (total_sales - total_purchases) / total_sales : 0.10;
  ncm = Math.max(0.05, Math.min(0.25, ncm));
  let fmcf = (avgSales * ncm) - existing_emi;

  // Amortization (24 months, 14% p.a.)
  let r_monthly = 0.14 / 12.0;
  let n_months = 24;
  let amortization_factor = r_monthly * Math.pow(1.0 + r_monthly, n_months) / (Math.pow(1.0 + r_monthly, n_months) - 1.0);

  // Proposed EMI <= (avgSales * ncm / 1.25) - existing_emi
  let max_proposed_emi = (avgSales * ncm / 1.25) - existing_emi;
  let loan_amount = 0;
  let calculated_dscr = 0;

  if (max_proposed_emi > 0 && !is_knocked_out) {
    let raw_loan = max_proposed_emi / amortization_factor;
    loan_amount = Math.min(raw_loan, avgSales * 3.0);
    let proposed_emi = loan_amount * amortization_factor;
    calculated_dscr = (fmcf + existing_emi) / (proposed_emi + existing_emi);
  }

  // Deductions List
  let score_deductions = [];
  if (bounce_penalty > 0) {
    score_deductions.push({
      component: "Cash Flow Score",
      deduction: -bounce_penalty,
      reason: `${cheque_bounces_3m} bounce(s) detected in last 3 months`
    });
  }
  if (ratio_penalty > 0) {
    score_deductions.push({
      component: "Tax Compliance Score",
      deduction: -ratio_penalty,
      reason: `GST Reconciliation match is ${Math.round(compliance_ratio * 100)}%`
    });
  }

  // Strengths / Risks
  let strengths = [];
  let risks = [];
  let recommendations = [];

  if (is_knocked_out) {
    risks.push("Knockout Filter Triggered: Application does not meet credit guidelines.");
    if (cibil_score < 680) risks.push(`Promoter CIBIL (${cibil_score}) is below required 680.`);
    if (debt_to_income > 50) risks.push(`Debt-to-Income (${debt_to_income.toFixed(1)}%) is above allowed 50%.`);
    if (cheque_bounces_3m > 2) risks.push(`Cheque bounce count (${cheque_bounces_3m}) exceeds safety threshold.`);
    if (gst_filing_delay_days > 60) risks.push(`GST tax filing delay (${gst_filing_delay_days} days) exceeds 60-day limit.`);
    
    recommendations.push({
      category: "Eligibility Improvement",
      recommendation_text: "Resolve outstanding GST filing delays and clear short-term liabilities to repair the primary scorecard indicators before reapplying."
    });
  } else {
    if (compliance_score >= 80) {
      strengths.push("High GST compliance rate with consistent monthly filings.");
    } else {
      risks.push("Irregular GST filing pattern which might indicate compliance challenges.");
      recommendations.push({
        category: "Compliance",
        recommendation_text: "Establish a monthly calendar to file GST GSTR-1 and GSTR-3B at least 3 days before the deadline."
      });
    }

    if (mom_growth > 0) {
      strengths.push(`Steady positive revenue growth rate of ${mom_growth.toFixed(1)}% MoM.`);
    } else {
      risks.push(`Declining sales trajectory (${mom_growth.toFixed(1)}% MoM).`);
      recommendations.push({
        category: "Growth",
        recommendation_text: "Enhance revenue growth potential by exploring B2B e-commerce platforms or registering on government MSME procurement portals (like GeM)."
      });
    }

    if (debt_to_income > 30) {
      risks.push(`High debt service ratio of ${debt_to_income.toFixed(1)}% relative to monthly receipts.`);
      recommendations.push({
        category: "Debt Management",
        recommendation_text: "Consolidate existing high-interest short-term EMIs into a single low-interest facility."
      });
    } else {
      strengths.push("Low existing debt service load relative to cash receipts.");
    }
  }

  if (strengths.length === 0 && !is_knocked_out) strengths.push("Basic operational stability is present.");
  if (risks.length === 0) risks.push("No immediate high risk flags detected.");
  if (recommendations.length === 0) {
    recommendations.push({
      category: "General",
      recommendation_text: "Maintain your strong compliance and high cash buffers to maintain an excellent health tier."
    });
  }

  const audit_trail = {
    knockout_checks,
    financial_evidence: {
      estimated_operating_margin: `${(ncm * 100).toFixed(1)}%`,
      debt_service_coverage_ratio: loan_amount > 0 ? `${calculated_dscr.toFixed(2)}x (Proposed EMI of ₹${Math.round(loan_amount * amortization_factor).toLocaleString('en-IN')} on loan of ₹${Math.round(loan_amount).toLocaleString('en-IN')} is viable)` : `₹0.00 eligibility (Existing EMIs consume free cash flow)`,
      gst_reconciliation_variance: `${(compliance_ratio * 100).toFixed(1)}% match between GSTR-1 and GSTR-3B`,
      peer_comparison: rg >= 0 ? `Outperforming sector average growth by +${rg.toFixed(1)}%` : `Underperforming sector average growth by ${Math.abs(rg).toFixed(1)}%`
    },
    score_deductions
  };

  return {
    scores: {
      overall_score,
      revenue_score,
      cash_flow_score,
      compliance_score,
      growth_score: Math.round(growth_factor),
      stability_score: Math.round(stability_score),
      risk_category,
      confidence_score,
      loan_amount: Math.round(loan_amount),
      audit_trail
    },
    explainability: {
      strengths,
      risks,
      summary: is_knocked_out 
        ? `MSME credit assessment is REJECTED due to knockout rules. Promoter score or transaction hygiene failed to meet thresholds.` 
        : `MSME shows ${risk_category.toLowerCase()} credit risk with an overall health score of ${overall_score}.`
    },
    recommendations
  };
}

export async function POST(request: Request) {
  try {
    const { msmeId, riskProfile } = await request.json();
    if (!msmeId || !riskProfile) {
      return NextResponse.json({ error: 'msmeId and riskProfile are required' }, { status: 400 });
    }

    const profile = mockProfiles[riskProfile];
    if (!profile) {
      return NextResponse.json({ error: 'Invalid riskProfile requested' }, { status: 400 });
    }

    // 1. Store monthly summaries in the database
    for (const item of profile.gst) {
      await saveGstSummary(msmeId, item.month, item);
    }
    for (const item of profile.upi) {
      await saveUpiSummary(msmeId, item.month, item);
    }
    for (const item of profile.aa) {
      await saveAaSummary(msmeId, item.month, item);
    }
    for (const item of profile.epfo) {
      await saveEpfoSummary(msmeId, item.month, item);
    }

    // 2. Dispatch to FastAPI AI Engine
    let apiData = null;
    try {
      const response = await fetch('http://localhost:8000/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gst: profile.gst,
          upi: profile.upi,
          aa: profile.aa,
          epfo: profile.epfo,
          cibil_score: profile.cibil_score,
          cheque_bounces_3m: profile.cheque_bounces_3m,
          gst_filing_delay_days: profile.gst_filing_delay_days,
          industry_growth_rate: profile.industry_growth_rate
        })
      });
      if (response.ok) {
        apiData = await response.json();
      }
    } catch (err) {
      console.warn("FastAPI service not reachable, executing JS scoring engine fallback", err);
    }

    // 3. Fallback calculation if FastAPI is down
    if (!apiData) {
      apiData = calculateScoreFallback({
        gst: profile.gst,
        upi: profile.upi,
        aa: profile.aa,
        epfo: profile.epfo,
        cibil_score: profile.cibil_score,
        cheque_bounces_3m: profile.cheque_bounces_3m,
        gst_filing_delay_days: profile.gst_filing_delay_days,
        industry_growth_rate: profile.industry_growth_rate
      });
    }

    // 4. Save results to Database
    const { audit_trail, ...dbScores } = apiData.scores;
    const healthCard = await saveFinancialHealthCard(msmeId, {
      ...dbScores,
      strengths: apiData.explainability.strengths,
      risks: apiData.explainability.risks
    });
    await saveRecommendations(msmeId, apiData.recommendations);

    return NextResponse.json({
      success: true,
      card: {
        ...healthCard,
        strengths: apiData.explainability.strengths,
        risks: apiData.explainability.risks,
        summary: apiData.explainability.summary,
        audit_trail: apiData.scores.audit_trail
      },
      recommendations: apiData.recommendations
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
