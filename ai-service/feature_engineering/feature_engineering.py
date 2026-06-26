import numpy as np
import pandas as pd
from typing import Dict, List, Any

def compute_gst_features(gst_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes features from monthly GST summaries:
    - revenue_growth: Percentage growth in sales over the periods.
    - revenue_stability: Coefficient of variation of monthly sales (lower is more stable).
    - compliance_score: Percentage of filed status.
    """
    if not gst_data:
        return {
            "revenue_growth": 0.0,
            "revenue_stability": 50.0,
            "compliance_score": 0.0,
            "total_sales": 0.0,
            "total_purchases": 0.0,
            "gst_reconciliation_ratio": 1.0,
            "avg_monthly_sales": 0.0
        }
    
    df = pd.DataFrame(gst_data)
    df['monthly_sales'] = pd.to_numeric(df['monthly_sales'], errors='coerce').fillna(0.0)
    df['monthly_purchases'] = pd.to_numeric(df['monthly_purchases'], errors='coerce').fillna(0.0)
    
    # Sort by month
    df = df.sort_values('month')
    
    # Compliance: Filed / Total
    filed_count = sum(df['gst_filing_status'].astype(str).str.lower() == 'filed')
    compliance_score = (filed_count / len(df)) * 100.0 if len(df) > 0 else 0.0
    
    sales = df['monthly_sales'].values
    total_sales = float(np.sum(sales))
    
    # Revenue Growth
    if len(sales) > 1:
        # Average month-on-month percentage growth
        mom_growth = []
        for i in range(1, len(sales)):
            prev = sales[i-1]
            curr = sales[i]
            if prev > 0:
                mom_growth.append((curr - prev) / prev * 100.0)
            else:
                mom_growth.append(0.0)
        revenue_growth = float(np.mean(mom_growth))
    else:
        revenue_growth = 0.0
        
    # Revenue Stability (Coefficient of variation: Std / Mean)
    mean_sales = np.mean(sales)
    if mean_sales > 0:
        cv = (np.std(sales) / mean_sales) * 100.0
        # Bound cv and invert so higher score is better stability
        revenue_stability = max(0.0, 100.0 - cv)
    else:
        revenue_stability = 0.0

    # Total Purchases
    purchases = df['monthly_purchases'].values
    total_purchases = float(np.sum(purchases))

    # Calculate GSTR-3B vs GSTR-1 Sales Compliance Ratio
    if 'gstr1_sales' in df.columns and 'gstr3b_sales' in df.columns:
        # Use monthly_sales as a fallback if gstr1_sales or gstr3b_sales are null
        total_gstr1 = pd.to_numeric(df['gstr1_sales'], errors='coerce').fillna(df['monthly_sales']).sum()
        total_gstr3b = pd.to_numeric(df['gstr3b_sales'], errors='coerce').fillna(df['monthly_sales']).sum()
        gst_reconciliation_ratio = float(total_gstr3b / total_gstr1) if total_gstr1 > 0 else 1.0
    else:
        # Fallback logic if columns are missing
        gst_reconciliation_ratio = 1.0
        
    avg_monthly_sales = float(np.mean(sales)) if len(sales) > 0 else 0.0

    return {
        "revenue_growth": revenue_growth,
        "revenue_stability": revenue_stability,
        "compliance_score": compliance_score,
        "total_sales": total_sales,
        "total_purchases": total_purchases,
        "gst_reconciliation_ratio": gst_reconciliation_ratio,
        "avg_monthly_sales": avg_monthly_sales
    }

def compute_upi_features(upi_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes features from UPI summaries:
    - cash_flow_stability: Volatility of net cash flow.
    - avg_monthly_volume: Average transaction count.
    - net_cash_flow: Total Credits - Total Debits.
    """
    if not upi_data:
        return {
            "cash_flow_stability": 50.0,
            "avg_monthly_volume": 0.0,
            "net_cash_flow": 0.0
        }
        
    df = pd.DataFrame(upi_data)
    df['total_credits'] = pd.to_numeric(df['total_credits'], errors='coerce').fillna(0.0)
    df['total_debits'] = pd.to_numeric(df['total_debits'], errors='coerce').fillna(0.0)
    df['num_transactions'] = pd.to_numeric(df['num_transactions'], errors='coerce').fillna(0)
    
    df['net_flow'] = df['total_credits'] - df['total_debits']
    
    # Net cash flow overall
    net_cash_flow = float(df['net_flow'].sum())
    
    # Average transaction count
    avg_monthly_volume = float(df['num_transactions'].mean())
    
    # Net cash flow stability (standard deviation / mean credits, mapped to 0-100)
    mean_credits = df['total_credits'].mean()
    if mean_credits > 0:
        std_flow = df['net_flow'].std()
        if pd.isna(std_flow):
            std_flow = 0.0
        cv = (std_flow / mean_credits) * 100.0
        cash_flow_stability = max(0.0, 100.0 - cv)
    else:
        cash_flow_stability = 0.0
        
    return {
        "cash_flow_stability": cash_flow_stability,
        "avg_monthly_volume": avg_monthly_volume,
        "net_cash_flow": net_cash_flow
    }

def compute_aa_features(aa_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes features from Account Aggregator (AA) summaries:
    - debt_to_income: Ratio of EMIs to total credits.
    - liquidity_score: Average balance / monthly debits.
    - credit_behavior: On-time vs missed payments.
    """
    if not aa_data:
        return {
            "debt_to_income": 0.0,
            "liquidity_score": 50.0,
            "credit_behavior": 100.0,
            "avg_existing_emi": 0.0
        }
        
    df = pd.DataFrame(aa_data)
    df['average_balance'] = pd.to_numeric(df['average_balance'], errors='coerce').fillna(0.0)
    df['monthly_credits'] = pd.to_numeric(df['monthly_credits'], errors='coerce').fillna(0.0)
    df['monthly_debits'] = pd.to_numeric(df['monthly_debits'], errors='coerce').fillna(0.0)
    df['existing_emi'] = pd.to_numeric(df['existing_emi'], errors='coerce').fillna(0.0)
    
    # Debt to Income (existing EMI / credits)
    total_credits = df['monthly_credits'].sum()
    total_emis = df['existing_emi'].sum()
    debt_to_income = (total_emis / total_credits) * 100.0 if total_credits > 0 else 0.0
    
    # Liquidity Score: Avg Balance / Avg Debits mapped to 100
    avg_bal = df['average_balance'].mean()
    avg_deb = df['monthly_debits'].mean()
    if avg_deb > 0:
        ratio = avg_bal / avg_deb
        liquidity_score = min(100.0, ratio * 100.0)
    else:
        liquidity_score = 100.0 if avg_bal > 0 else 50.0
        
    # Credit Behavior (On-Time repayment count ratio)
    status_col = df['loan_repayment_status'].astype(str).str.lower()
    on_time = sum(status_col == 'on-time')
    credit_behavior = (on_time / len(df)) * 100.0 if len(df) > 0 else 100.0
    
    avg_existing_emi = float(df['existing_emi'].mean()) if len(df) > 0 else 0.0

    return {
        "debt_to_income": debt_to_income,
        "liquidity_score": liquidity_score,
        "credit_behavior": credit_behavior,
        "avg_existing_emi": avg_existing_emi
    }

def compute_epfo_features(epfo_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes features from EPFO summaries:
    - employee_growth: Percentage growth in employee count.
    - workforce_stability: Coeff of variation of headcount.
    """
    if not epfo_data:
        return {
            "employee_growth": 0.0,
            "workforce_stability": 100.0,
            "avg_payroll": 0.0
        }
        
    df = pd.DataFrame(epfo_data)
    df['employee_count'] = pd.to_numeric(df['employee_count'], errors='coerce').fillna(0)
    df['payroll'] = pd.to_numeric(df['payroll'], errors='coerce').fillna(0.0)
    
    df = df.sort_values('month')
    emp_counts = df['employee_count'].values
    avg_payroll = float(df['payroll'].mean())
    
    # Employee growth
    if len(emp_counts) > 1 and emp_counts[0] > 0:
        employee_growth = ((emp_counts[-1] - emp_counts[0]) / emp_counts[0]) * 100.0
    else:
        employee_growth = 0.0
        
    # Workforce stability (100 - Coefficient of Variation)
    mean_emp = np.mean(emp_counts)
    if mean_emp > 0:
        cv = (np.std(emp_counts) / mean_emp) * 100.0
        workforce_stability = max(0.0, 100.0 - cv)
    else:
        workforce_stability = 100.0
        
    return {
        "employee_growth": employee_growth,
        "workforce_stability": workforce_stability,
        "avg_payroll": avg_payroll
    }

def engineer_all_features(payload: Dict[str, List[Any]]) -> Dict[str, Any]:
    """
    Engineers high-level features from raw components.
    """
    gst = compute_gst_features(payload.get("gst", []))
    upi = compute_upi_features(payload.get("upi", []))
    aa = compute_aa_features(payload.get("aa", []))
    epfo = compute_epfo_features(payload.get("epfo", []))
    
    return {
        **gst,
        **upi,
        **aa,
        **epfo
    }
