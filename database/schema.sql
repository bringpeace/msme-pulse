-- MSME Pulse Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MSMEs table
CREATE TABLE IF NOT EXISTS msmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15) UNIQUE,
    pan VARCHAR(10),
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GST Summary (monthly summaries)
CREATE TABLE IF NOT EXISTS gst_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msme_id UUID REFERENCES msmes(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    monthly_sales NUMERIC(15, 2) NOT NULL,
    monthly_purchases NUMERIC(15, 2) NOT NULL,
    gst_filing_status VARCHAR(50) NOT NULL, -- e.g., Filed, Pending, Delayed
    filing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(msme_id, month)
);

-- UPI Summary (monthly summaries)
CREATE TABLE IF NOT EXISTS upi_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msme_id UUID REFERENCES msmes(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_credits NUMERIC(15, 2) NOT NULL,
    total_debits NUMERIC(15, 2) NOT NULL,
    num_transactions INT NOT NULL,
    avg_transaction_value NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(msme_id, month)
);

-- Account Aggregator (AA) Summary (monthly summaries)
CREATE TABLE IF NOT EXISTS aa_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msme_id UUID REFERENCES msmes(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    average_balance NUMERIC(15, 2) NOT NULL,
    monthly_credits NUMERIC(15, 2) NOT NULL,
    monthly_debits NUMERIC(15, 2) NOT NULL,
    existing_emi NUMERIC(15, 2) DEFAULT 0.00,
    loan_repayment_status VARCHAR(50) DEFAULT 'On-Time', -- e.g., On-Time, Missed, Delayed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(msme_id, month)
);

-- EPFO Summary (monthly summaries)
CREATE TABLE IF NOT EXISTS epfo_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msme_id UUID REFERENCES msmes(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    employee_count INT NOT NULL,
    payroll NUMERIC(15, 2) NOT NULL,
    employer_contribution NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(msme_id, month)
);

-- Financial Health Cards table
CREATE TABLE IF NOT EXISTS financial_health_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msme_id UUID REFERENCES msmes(id) ON DELETE CASCADE UNIQUE,
    overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    revenue_score INT NOT NULL CHECK (revenue_score BETWEEN 0 AND 100),
    cash_flow_score INT NOT NULL CHECK (cash_flow_score BETWEEN 0 AND 100),
    compliance_score INT NOT NULL CHECK (compliance_score BETWEEN 0 AND 100),
    growth_score INT NOT NULL CHECK (growth_score BETWEEN 0 AND 100),
    stability_score INT NOT NULL CHECK (stability_score BETWEEN 0 AND 100),
    risk_category VARCHAR(50) NOT NULL, -- e.g., Low, Medium, High
    loan_amount NUMERIC(15, 2) DEFAULT 0.00,
    confidence_score INT NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    strengths TEXT[] DEFAULT '{}',
    risks TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msme_id UUID REFERENCES msmes(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., Cash Flow, Compliance, General
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
