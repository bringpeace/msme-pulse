from typing import Dict, List, Any

def generate_explanations(features: Dict[str, Any], scores: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates explainable insights (Strengths, Risks, and Score summaries)
    based on computed scores and features.
    """
    strengths: List[str] = []
    risks: List[str] = []
    
    # Analyze GST features
    if features.get("compliance_score", 0.0) >= 85:
        strengths.append("High GST compliance rate with consistent monthly filings.")
    elif features.get("compliance_score", 0.0) < 70:
        risks.append("Irregular GST filing pattern which might indicate compliance challenges.")
        
    if features.get("revenue_stability", 0.0) >= 80:
        strengths.append("Stable and predictable monthly sales cycle.")
    elif features.get("revenue_stability", 0.0) < 50:
        risks.append("Highly volatile sales trends month-on-month.")
        
    if features.get("revenue_growth", 0.0) > 10:
        strengths.append(f"Strong double-digit monthly revenue growth rate of {features['revenue_growth']:.1f}%.")
    elif features.get("revenue_growth", 0.0) < -5:
        risks.append(f"Declining revenue trends with negative growth rate of {features['revenue_growth']:.1f}%.")
        
    # Analyze UPI & AA features
    if features.get("cash_flow_stability", 0.0) >= 80:
        strengths.append("Robust transactional velocity and healthy cash reserves.")
    elif features.get("cash_flow_stability", 0.0) < 50:
        risks.append("Volatile UPI cash flows with potential liquidity crunches.")
        
    if features.get("debt_to_income", 0.0) < 10 and features.get("debt_to_income", 0.0) > 0:
        strengths.append("Very low existing debt service load relative to cash receipts.")
    elif features.get("debt_to_income", 0.0) > 30:
        risks.append(f"High debt service ratio of {features['debt_to_income']:.1f}%; large share of income goes to EMIs.")
        
    if features.get("liquidity_score", 0.0) >= 80:
        strengths.append("Maintains substantial cash buffer relative to monthly outflows.")
    elif features.get("liquidity_score", 0.0) < 40:
        risks.append("Low average balance buffer which may lead to payment bouncing risk.")
        
    # Analyze EPFO features
    if features.get("employee_growth", 0.0) > 5:
        strengths.append("Expanding employee headcount suggesting operational growth.")
    if features.get("workforce_stability", 0.0) >= 90:
        strengths.append("Stable labor force with zero or minimal attrition.")
    elif features.get("workforce_stability", 0.0) < 60:
        risks.append("Fluctuating headcount contributions suggesting high labor turnover.")
        
    # Default fallbacks to prevent empty arrays
    if not strengths:
        strengths.append("Maintains basic operational indicators.")
    if not risks:
        risks.append("No critical credit risk flags identified in alternate data.")
        
    # Score Summary
    overall = scores["overall_score"]
    if overall >= 80:
        summary_text = (
            f"The business exhibits exceptional financial health with an overall score of {overall}. "
            "Strong sales stability, high GST compliance, and healthy cash reserves make this MSME "
            "an excellent candidate for premium lending packages."
        )
    elif overall >= 50:
        summary_text = (
            f"The business exhibits moderate credit health with a score of {overall}. "
            "While basic operations are stable, minor cash flow fluctuations or compliance delays "
            "indicate that structured credit limits or short-term working capital loans are recommended."
        )
    else:
        summary_text = (
            f"The business has a high-risk credit profile with a score of {overall}. "
            "Elevated cash flow volatility, high debt exposure, or tax filing irregularities "
            "suggest that credit should be deferred or offered with strong collateral protection."
        )
        
    return {
        "strengths": strengths,
        "risks": risks,
        "summary": summary_text
    }
