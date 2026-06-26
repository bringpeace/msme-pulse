from typing import Dict, List, Any

def generate_recommendations(features: Dict[str, Any], scores: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates actionable improvement steps for the MSME based on areas of weakness.
    """
    recs = []
    
    # Check Compliance
    if scores.get("compliance_score", 100) < 90:
        recs.append({
            "category": "Compliance",
            "recommendation_text": "Establish a monthly calendar to file GST GSTR-1 and GSTR-3B at least 3 days before the deadline. Consistent filing directly improves credit eligibility confidence."
        })
        
    # Check Cash Flow
    if features.get("cash_flow_stability", 100.0) < 70:
        recs.append({
            "category": "Cash Flow",
            "recommendation_text": "Reduce cash flow volatility by setting up auto-reminders for receivables and encouraging UPI collections spread out evenly across the month."
        })
        
    if features.get("liquidity_score", 100.0) < 60:
        recs.append({
            "category": "Cash Flow",
            "recommendation_text": "Maintain an average daily bank balance of at least 15% of your average monthly debits to buffer against delayed payments and improve liquidity scores."
        })
        
    # Check Debt burden
    if features.get("debt_to_income", 0.0) > 20:
        recs.append({
            "category": "Debt Management",
            "recommendation_text": "Consolidate existing high-interest short-term EMIs into a single low-interest long-term working capital facility to lower your monthly Debt Service ratio."
        })
        
    # Check Growth / Workforce
    if features.get("workforce_stability", 100.0) < 80:
        recs.append({
            "category": "Business Stability",
            "recommendation_text": "Stabilize payroll structures by maintaining a consistent headcount and avoiding high turnover in critical employee categories."
        })
        
    if scores.get("growth_score", 100) < 60:
        recs.append({
            "category": "Growth",
            "recommendation_text": "Enhance revenue growth potential by exploring B2B e-commerce platforms or registering on government MSME procurement portals (like GeM)."
        })
        
    # Add a generic recommendation if empty
    if not recs:
        recs.append({
            "category": "General",
            "recommendation_text": "Maintain your strong compliance and high cash buffers. Continue recording all business receipts digitally via UPI to maintain an excellent health tier."
        })
        
    return recs
