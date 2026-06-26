# MSME Pulse 📊
### AI-Powered Alternative Financial Health Card & Underwriting Engine (V2.0)

**MSME Pulse** is an explainable credit underwriting portal and scoring pipeline that converts alternate digital footprints (GST tax records, UPI transactional data, Account Aggregator logs, and EPFO employee indices) into a single, cohesive **Financial Health Score (0-100)** and a verified credit underwriting limit.

---

## 🛠️ Key Underwriting Engine Capabilities (BRD v2.0)

1. **Hard Knockout Filters (Go/No-Go)**:
   Instantly short-circuits scoring and sets the category to `REJECTED` and score to `0` if critical risk parameters fail:
   * **Promoter CIBIL Score**: `< 680`
   * **Debt-to-Income (DTI)**: `> 50%`
   * **Transactional Hygiene**: `> 2` cheque/ECS bounces in the last 3 months
   * **Tax Defaults**: GST GSTR-3B filing delays `> 60 days`

2. **DSCR-Based Loan Eligibility Solver**:
   * Estimates **Net Cash Margin (NCM)** using GST Sales & Purchases (capped at $5\%$ to $25\%$).
   * Calculates **Free Monthly Cash Flow (FMCF)** after existing EMI obligations.
   * Numerically solves for the recommended loan size matching proposed EMIs under the strict regulatory limit of **$DSCR \ge 1.25$** (standard 24-month term at $14\%$ p.a.).

3. **Tax Reconciliation & Hygiene Adjustments**:
   * **GST Compliance Ratio**: Cross-matches supply declarations in **GSTR-1** with settlements in **GSTR-3B**, applying penalties for mismatches (Ratio $< 0.85$ triggers a invoice inflation audit warning and a $-30$ points deduction).
   * **Bounces Penalty Ledger**: Deducts $-10$ points for 1 bounce and $-25$ points for 2 bounces from the Cash Flow scorecard.

4. **Sector Peer Calibration**:
   * Compares the MSME's revenue growth with the industry average ($I_g$) for its sector.
   * Grants $+5$ points bonus for outperforming sector averages ($RG > 10\%$) or applies a $-10$ points deduction for underperforming ($RG < -10\%$).

5. **Explainable AI (XAI) Audit Drawer UI**:
   * Right-sliding modal displays the complete audit trails mapping:
     * **Summary**: Live Go/No-Go knockout check statuses.
     * **Data Used**: Linked verified alternate streams.
     * **Calculations**: Operating margins, DSCR solver details, GSTR reconciliation ratio, and score deductions.
     * **Projections**: Live "How to improve score" steps.

---

## 📂 Repository Directory Structure

```bash
msme-pulse/
├── ai-service/          # Python FastAPI scoring engine & engineered features pipeline
│   ├── explainability/  # Recommendations & AI underwriter justification engines
│   ├── feature_engineering/ # GST, UPI, AA, & EPFO feature calculation
│   ├── scoring/         # Hard knockouts, DSCR solvers, & audit trail formats (V2.0)
│   ├── main.py          # FastAPI service runner
│   └── requirements.txt # Python project dependencies
│
├── web/                 # Next.js 13 UI portal & local database connectors
│   ├── src/app/         # Front-end layout, dashboard, & sliding XAI drawer
│   ├── src/lib/         # Database helper (db.ts) & mock profile configs
│   ├── package.json     # Node scripts & dependencies
│   └── tailwind.config  # Custom theme colors (glassmorphism & deep indigo dark mode)
│
├── database/            # SQL database specifications
│   └── schema.sql       # PostgreSQL structure mapping
└── docs/                # Core product documentations
    └── brd_credit_scoring_engine.md # Business Requirement Document V2.0
```

---

## ⚡ Quick Start Instructions

### 1. Start the FastAPI Scoring Engine
Make sure python is installed, then launch the FastAPI server:
```bash
cd ai-service
# Activate your python virtual environment (venv)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run uvicorn server on port 8000
python main.py
```

### 2. Start the Next.js UI Portal
Open a new shell session:
```bash
cd web

# Install node dependencies
npm install

# Launch development web server
npm run dev
```
Open **`http://localhost:3000`** in your browser to view the banker portal dashboard.

---

## 🧪 Testing Profiles & Simulation
* **Low Risk Profile**: *Sri Venkateshwara Enterprises* (CIBIL: 750, 0 bounces, positive growth). Solves for positive loan eligibility under $DSCR \ge 1.25$.
* **Medium Risk Profile**: *Apex Digital Solutions* (CIBIL: 690, 1 bounce, minor delays). Applies deductions and resolves a moderate limit.
* **High Risk Profile**: *Sai Fabricators* (CIBIL: 620, 3 bounces, 75-day GST delay). Triggers immediate knockout short-circuits (Score: 0, Category: REJECTED).
* **Scoring Sandbox**: Use the range sliders to tweak GST compliance, sales growth, or debt loads dynamically on the fly to simulate scorecard reactions.
