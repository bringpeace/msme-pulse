export interface MockProfile {
  id: string;
  businessName: string;
  gstin: string;
  pan: string;
  cibil_score: number;
  cheque_bounces_3m: number;
  gst_filing_delay_days: number;
  industry_growth_rate: number;
  gst: any[];
  upi: any[];
  aa: any[];
  epfo: any[];
}

export const mockProfiles: Record<string, MockProfile> = {
  "low-risk": {
    id: "low-risk-msme-id",
    businessName: "Sri Venkateshwara Enterprises",
    gstin: "27AAAAA1111A1Z1",
    pan: "AAAAA1111A",
    cibil_score: 750,
    cheque_bounces_3m: 0,
    gst_filing_delay_days: 5,
    industry_growth_rate: 8.0,
    gst: [
      { month: "2026-01", monthly_sales: 1200000, monthly_purchases: 800000, gst_filing_status: "Filed", filing_date: "2026-02-10", gstr1_sales: 1200000, gstr3b_sales: 1200000 },
      { month: "2026-02", monthly_sales: 1250000, monthly_purchases: 820000, gst_filing_status: "Filed", filing_date: "2026-03-09", gstr1_sales: 1250000, gstr3b_sales: 1250000 },
      { month: "2026-03", monthly_sales: 1300000, monthly_purchases: 850000, gst_filing_status: "Filed", filing_date: "2026-04-10", gstr1_sales: 1300000, gstr3b_sales: 1300000 },
      { month: "2026-04", monthly_sales: 1380000, monthly_purchases: 900000, gst_filing_status: "Filed", filing_date: "2026-05-08", gstr1_sales: 1380000, gstr3b_sales: 1380000 },
      { month: "2026-05", monthly_sales: 1420000, monthly_purchases: 930000, gst_filing_status: "Filed", filing_date: "2026-06-10", gstr1_sales: 1420000, gstr3b_sales: 1420000 },
    ],
    upi: [
      { month: "2026-01", total_credits: 1000000, total_debits: 800000, num_transactions: 340, avg_transaction_value: 2941 },
      { month: "2026-02", total_credits: 1050000, total_debits: 810000, num_transactions: 360, avg_transaction_value: 2916 },
      { month: "2026-03", total_credits: 1100000, total_debits: 840000, num_transactions: 380, avg_transaction_value: 2894 },
      { month: "2026-04", total_credits: 1180000, total_debits: 890000, num_transactions: 410, avg_transaction_value: 2878 },
      { month: "2026-05", total_credits: 1220000, total_debits: 920000, num_transactions: 430, avg_transaction_value: 2837 },
    ],
    aa: [
      { month: "2026-01", average_balance: 450000, monthly_credits: 1150000, monthly_debits: 950000, existing_emi: 20000, loan_repayment_status: "On-Time" },
      { month: "2026-02", average_balance: 470000, monthly_credits: 1190000, monthly_debits: 970000, existing_emi: 20000, loan_repayment_status: "On-Time" },
      { month: "2026-03", average_balance: 490000, monthly_credits: 1240000, monthly_debits: 1020000, existing_emi: 20000, loan_repayment_status: "On-Time" },
      { month: "2026-04", average_balance: 520000, monthly_credits: 1310000, monthly_debits: 1080000, existing_emi: 20000, loan_repayment_status: "On-Time" },
      { month: "2026-05", average_balance: 550000, monthly_credits: 1350000, monthly_debits: 1120000, existing_emi: 20000, loan_repayment_status: "On-Time" },
    ],
    epfo: [
      { month: "2026-01", employee_count: 24, payroll: 720000, employer_contribution: 86400 },
      { month: "2026-02", employee_count: 24, payroll: 720000, employer_contribution: 86400 },
      { month: "2026-03", employee_count: 25, payroll: 750000, employer_contribution: 90000 },
      { month: "2026-04", employee_count: 25, payroll: 750000, employer_contribution: 90000 },
      { month: "2026-05", employee_count: 26, payroll: 780000, employer_contribution: 93600 },
    ],
  },
  "medium-risk": {
    id: "medium-risk-msme-id",
    businessName: "Apex Digital Solutions",
    gstin: "27BBBBB2222B2Z2",
    pan: "BBBBB2222B",
    cibil_score: 690,
    cheque_bounces_3m: 1,
    gst_filing_delay_days: 15,
    industry_growth_rate: 6.0,
    gst: [
      { month: "2026-01", monthly_sales: 600000, monthly_purchases: 450000, gst_filing_status: "Filed", filing_date: "2026-02-12", gstr1_sales: 600000, gstr3b_sales: 558000 },
      { month: "2026-02", monthly_sales: 620000, monthly_purchases: 460000, gst_filing_status: "Filed", filing_date: "2026-03-15", gstr1_sales: 620000, gstr3b_sales: 576600 },
      { month: "2026-03", monthly_sales: 590000, monthly_purchases: 440000, gst_filing_status: "Pending", filing_date: null, gstr1_sales: 590000, gstr3b_sales: 548700 },
      { month: "2026-04", monthly_sales: 610000, monthly_purchases: 450000, gst_filing_status: "Filed", filing_date: "2026-05-22", gstr1_sales: 610000, gstr3b_sales: 567300 },
      { month: "2026-05", monthly_sales: 600000, monthly_purchases: 460000, gst_filing_status: "Filed", filing_date: "2026-06-11", gstr1_sales: 600000, gstr3b_sales: 558000 },
    ],
    upi: [
      { month: "2026-01", total_credits: 520000, total_debits: 480000, num_transactions: 180, avg_transaction_value: 2888 },
      { month: "2026-02", total_credits: 530000, total_debits: 490000, num_transactions: 190, avg_transaction_value: 2789 },
      { month: "2026-03", total_credits: 500000, total_debits: 470000, num_transactions: 170, avg_transaction_value: 2941 },
      { month: "2026-04", total_credits: 510000, total_debits: 480000, num_transactions: 175, avg_transaction_value: 2914 },
      { month: "2026-05", total_credits: 500000, total_debits: 475000, num_transactions: 180, avg_transaction_value: 2777 },
    ],
    aa: [
      { month: "2026-01", average_balance: 110000, monthly_credits: 540000, monthly_debits: 510000, existing_emi: 60000, loan_repayment_status: "On-Time" },
      { month: "2026-02", average_balance: 105000, monthly_credits: 550000, monthly_debits: 520000, existing_emi: 60000, loan_repayment_status: "On-Time" },
      { month: "2026-03", average_balance: 90000, monthly_credits: 520000, monthly_debits: 500000, existing_emi: 60000, loan_repayment_status: "On-Time" },
      { month: "2026-04", average_balance: 95000, monthly_credits: 530000, monthly_debits: 510000, existing_emi: 60000, loan_repayment_status: "On-Time" },
      { month: "2026-05", average_balance: 100000, monthly_credits: 520000, monthly_debits: 505000, existing_emi: 60000, loan_repayment_status: "On-Time" },
    ],
    epfo: [
      { month: "2026-01", employee_count: 8, payroll: 200000, employer_contribution: 24000 },
      { month: "2026-02", employee_count: 8, payroll: 200000, employer_contribution: 24000 },
      { month: "2026-03", employee_count: 8, payroll: 200000, employer_contribution: 24000 },
      { month: "2026-04", employee_count: 8, payroll: 200000, employer_contribution: 24000 },
      { month: "2026-05", employee_count: 8, payroll: 200000, employer_contribution: 24000 },
    ],
  },
  "high-risk": {
    id: "high-risk-msme-id",
    businessName: "Sai Fabricators",
    gstin: "27CCCCC3333C3Z3",
    pan: "CCCCC3333C",
    cibil_score: 620,
    cheque_bounces_3m: 3,
    gst_filing_delay_days: 75,
    industry_growth_rate: 5.0,
    gst: [
      { month: "2026-01", monthly_sales: 400000, monthly_purchases: 380000, gst_filing_status: "Filed", filing_date: "2026-02-28", gstr1_sales: 400000, gstr3b_sales: 280000 },
      { month: "2026-02", monthly_sales: 350000, monthly_purchases: 340000, gst_filing_status: "Pending", filing_date: null, gstr1_sales: 350000, gstr3b_sales: 245000 },
      { month: "2026-03", monthly_sales: 310000, monthly_purchases: 320000, gst_filing_status: "Pending", filing_date: null, gstr1_sales: 310000, gstr3b_sales: 217000 },
      { month: "2026-04", monthly_sales: 280000, monthly_purchases: 290000, gst_filing_status: "Filed", filing_date: "2026-05-30", gstr1_sales: 280000, gstr3b_sales: 196000 },
      { month: "2026-05", monthly_sales: 250000, monthly_purchases: 260000, gst_filing_status: "Pending", filing_date: null, gstr1_sales: 250000, gstr3b_sales: 175000 },
    ],
    upi: [
      { month: "2026-01", total_credits: 320000, total_debits: 310000, num_transactions: 80, avg_transaction_value: 4000 },
      { month: "2026-02", total_credits: 280000, total_debits: 290000, num_transactions: 65, avg_transaction_value: 4307 },
      { month: "2026-03", total_credits: 250000, total_debits: 260000, num_transactions: 50, avg_transaction_value: 5000 },
      { month: "2026-04", total_credits: 220000, total_debits: 230000, num_transactions: 45, avg_transaction_value: 4888 },
      { month: "2026-05", total_credits: 200000, total_debits: 210000, num_transactions: 40, avg_transaction_value: 5000 },
    ],
    aa: [
      { month: "2026-01", average_balance: 15000, monthly_credits: 300000, monthly_debits: 315000, existing_emi: 80000, loan_repayment_status: "Missed" },
      { month: "2026-02", average_balance: 8000, monthly_credits: 260000, monthly_debits: 275000, existing_emi: 80000, loan_repayment_status: "On-Time" },
      { month: "2026-03", average_balance: 5000, monthly_credits: 230000, monthly_debits: 240000, existing_emi: 80000, loan_repayment_status: "Missed" },
      { month: "2026-04", average_balance: 12000, monthly_credits: 205000, monthly_debits: 200000, existing_emi: 80000, loan_repayment_status: "On-Time" },
      { month: "2026-05", average_balance: 3000, monthly_credits: 190000, monthly_debits: 205000, existing_emi: 80000, loan_repayment_status: "Missed" },
    ],
    epfo: [
      { month: "2026-01", employee_count: 5, payroll: 100000, employer_contribution: 12000 },
      { month: "2026-02", employee_count: 4, payroll: 80000, employer_contribution: 9600 },
      { month: "2026-03", employee_count: 4, payroll: 80000, employer_contribution: 9600 },
      { month: "2026-04", employee_count: 3, payroll: 60000, employer_contribution: 7200 },
      { month: "2026-05", employee_count: 3, payroll: 60000, employer_contribution: 7200 },
    ],
  }
};
