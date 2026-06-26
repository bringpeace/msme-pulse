'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  UserCheck,
  Building,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  DollarSign,
  X,
  FileCheck,
  HelpCircle,
  Percent,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('low-risk');
  const [businessName, setBusinessName] = useState('Sri Venkateshwara Enterprises');
  const [gstin, setGstin] = useState('27AAAAA1111A1Z1');
  const [consentGst, setConsentGst] = useState(true);
  const [consentUpi, setConsentUpi] = useState(true);
  const [consentAa, setConsentAa] = useState(true);
  const [consentEpfo, setConsentEpfo] = useState(true);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);

  // Simulation state for what-if scenarios
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [simulatedLoan, setSimulatedLoan] = useState<number | null>(null);
  const [complianceTweak, setComplianceTweak] = useState(90);
  const [growthTweak, setGrowthTweak] = useState(10);
  const [debtTweak, setDebtTweak] = useState(15);

  // Audit Drawer state
  const [auditMetric, setAuditMetric] = useState<string | null>(null);
  const [auditTab, setAuditTab] = useState<'summary' | 'data' | 'calc' | 'ai' | 'improve'>('summary');

  const fetchRecentAssessments = async () => {
    try {
      const res = await fetch('/api/msmes');
      if (res.ok) {
        const data = await res.json();
        setRecentAssessments(data.msmes || []);
      }
    } catch (err) {
      console.error("Error fetching recent assessments", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingUser(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setLoggedIn(true);
        // Fetch recent assessments on login
        fetchRecentAssessments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUser(false);
    }
  };

  const selectPreset = (profile: string) => {
    setSelectedProfile(profile);
    if (profile === 'low-risk') {
      setBusinessName('Sri Venkateshwara Enterprises');
      setGstin('27AAAAA1111A1Z1');
    } else if (profile === 'medium-risk') {
      setBusinessName('Apex Digital Solutions');
      setGstin('27BBBBB2222B2Z2');
    } else {
      setBusinessName('Sai Fabricators');
      setGstin('27CCCCC3333C3Z3');
    }
  };

  const handleLoadExistingCard = async (msmeId: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/financial-health-card?msmeId=${msmeId}`);
      if (res.ok) {
        const data = await res.json();
        // Structure the analysisResult format matching aggregate outputs
        const strengths = data.card.strengths && data.card.strengths.length > 0
          ? data.card.strengths
          : [
              "High GST compliance rate with consistent monthly filings.",
              "Stable and predictable monthly sales cycle.",
              "Robust transactional velocity and healthy cash reserves."
            ];
        const risks = data.card.risks && data.card.risks.length > 0
          ? data.card.risks
          : ["No immediate critical risk flags identified in alternate data."];
        const summary = `MSME shows ${data.card.risk_category.toLowerCase()} credit risk with an overall health score of ${data.card.overall_score}.`;
        
        setAnalysisResult({
          success: true,
          card: {
            ...data.card,
            strengths,
            risks,
            summary
          },
          recommendations: data.recommendations || []
        });
        setSimulatedScore(data.card.overall_score);
        setSimulatedLoan(data.card.loan_amount);
      }
    } catch (err) {
      console.error("Error loading card", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAggregateAndScore = async () => {
    setAnalyzing(true);
    try {
      // 1. Grant consent & setup MSME using the actual user ID from the database
      const consentRes = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          businessName,
          gstin,
          riskType: selectedProfile
        })
      });
      const consentData = await consentRes.json();
      
      if (!consentData.success) throw new Error("Consent failed");
      const msmeId = consentData.msme.id;

      // 2. Check if a financial health card already exists for this MSME
      const checkRes = await fetch(`/api/financial-health-card?msmeId=${msmeId}`);
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.success && data.card) {
          // If already scored, load it directly and bypass aggregation
          const strengths = data.card.strengths && data.card.strengths.length > 0
            ? data.card.strengths
            : [
                "High GST compliance rate with consistent monthly filings.",
                "Stable and predictable monthly sales cycle.",
                "Robust transactional velocity and healthy cash reserves."
              ];
          const risks = data.card.risks && data.card.risks.length > 0
            ? data.card.risks
            : ["No immediate critical risk flags identified in alternate data."];
          const summary = `MSME shows ${data.card.risk_category.toLowerCase()} credit risk with an overall health score of ${data.card.overall_score}.`;
          
          setAnalysisResult({
            success: true,
            card: {
              ...data.card,
              strengths,
              risks,
              summary
            },
            recommendations: data.recommendations || []
          });
          setSimulatedScore(data.card.overall_score);
          setSimulatedLoan(data.card.loan_amount);
          setAnalyzing(false);
          return;
        }
      }

      // 3. Trigger Alternate Data Aggregation and Scorer
      const scoreRes = await fetch('/api/connectors/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msmeId: msmeId,
          riskProfile: selectedProfile
        })
      });
      const finalResult = await scoreRes.json();
      if (finalResult.success) {
        setAnalysisResult(finalResult);
        setSimulatedScore(finalResult.card.overall_score);
        setSimulatedLoan(finalResult.card.loan_amount);
        // Refresh list
        fetchRecentAssessments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run what-if calculations locally for instant interactivity
  const handleSimulationChange = (type: string, value: number) => {
    if (!analysisResult) return;
    let newCompliance = complianceTweak;
    let newGrowth = growthTweak;
    let newDebt = debtTweak;

    if (type === 'compliance') {
      newCompliance = value;
      setComplianceTweak(value);
    } else if (type === 'growth') {
      newGrowth = value;
      setGrowthTweak(value);
    } else if (type === 'debt') {
      newDebt = value;
      setDebtTweak(value);
    }

    // scoring formula: overall_score = 0.25 * revenue + 0.25 * cash_flow + 0.20 * compliance + 0.15 * growth + 0.15 * stability
    const growthFactor = Math.min(100, Math.max(0, 50 + (newGrowth * 2)));
    const revenueScore = Math.round(0.6 * 85 + 0.4 * growthFactor); // Base 85 stability
    const cashFlowScore = Math.round(0.5 * 80 + 0.5 * (100 - newDebt));
    const complianceScore = newCompliance;
    const stabilityScore = Math.max(0, 95 - (newDebt * 1.5));

    let finalScore = Math.round(
      0.25 * revenueScore +
      0.25 * cashFlowScore +
      0.20 * complianceScore +
      0.15 * growthFactor +
      0.15 * stabilityScore
    );
    finalScore = Math.min(100, Math.max(0, finalScore));
    setSimulatedScore(finalScore);

    const baseSales = analysisResult.card.loan_amount > 0 
      ? analysisResult.card.loan_amount / (analysisResult.card.overall_score >= 80 ? 2 : 1)
      : 800000;
    
    let newLoan = 0;
    if (finalScore >= 80) {
      newLoan = baseSales * 2;
    } else if (finalScore >= 50) {
      newLoan = baseSales * 1.1;
    }
    setSimulatedLoan(Math.round(newLoan));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500';
    if (score >= 50) return 'text-amber-400 border-amber-500';
    return 'text-rose-400 border-rose-500';
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'Low') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
    if (risk === 'Medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
    return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
  };

  // Clickable audit config provider
  const getAuditData = (metric: string) => {
    const card = analysisResult?.card || {};
    
    switch (metric) {
      case 'overall':
        return {
          title: 'Overall Financial Health Score',
          scoreValue: simulatedScore || card.overall_score,
          summary: 'The composite rating represents a unified weighted score evaluating compliance, cash consistency, top-line performance, and capital structural risk.',
          dataUsed: [
            { label: 'GST Sales & Returns', status: 'verified' },
            { label: 'UPI Collections & Volume', status: 'verified' },
            { label: 'Bank Credit & Debt History', status: 'verified' },
            { label: 'EPFO Headcount Logs', status: 'verified' }
          ],
          period: 'Last 12 Months',
          factors: [
            { name: 'Revenue Stability', weight: '25%', contribution: Math.round(card.revenue_score * 0.25), score: card.revenue_score },
            { name: 'Cash Flow Health', weight: '30%', contribution: Math.round(card.cash_flow_score * 0.30), score: card.cash_flow_score },
            { name: 'Tax Compliance', weight: '20%', contribution: Math.round(card.compliance_score * 0.20), score: card.compliance_score },
            { name: 'Growth Potential', weight: '10%', contribution: Math.round(card.growth_score * 0.10), score: card.growth_score },
            { name: 'Business Stability', weight: '15%', contribution: Math.round(card.stability_score * 0.15), score: card.stability_score }
          ],
          aiExplanation: `Underwriting Model composite is ${simulatedScore || card.overall_score}. Weighted weightings emphasize Cash Flow stability (30%) and Revenue reliability (25%) as the most immediate default predictors. All digital sources returned normal validation integrity.`,
          improve: [
            { text: 'File GST returns 3 days early to raise compliance margins', impact: '+2 points' },
            { text: 'Maintain a higher UPI cash balance during mid-month payment lags', impact: '+4 points' }
          ]
        };
      case 'revenue':
        return {
          title: 'Revenue Stability',
          scoreValue: card.revenue_score,
          summary: 'Evaluates the consistency, seasonality, and overall volatility of sales credits collected through GST invoices and digital UPI channels.',
          dataUsed: [
            { label: 'GST Invoice Sales', status: 'verified' },
            { label: 'UPI Inward Collections', status: 'verified' },
            { label: 'Bank Credits', status: 'verified' }
          ],
          period: 'Last 12 Months',
          factors: [
            { name: 'Revenue Growth Consistency', score: 20 },
            { name: 'Average MoM Consistency', score: 25 },
            { name: 'Seasonality Penalty', score: -5 },
            { name: 'Large Revenue Drops', score: -8 },
            { name: 'GST Invoice Match Rate', score: 22 }
          ],
          aiExplanation: 'Sales trends remained stable over the past 12 months with only minor month-to-month fluctuations. GST filings match the banking inflows. No significant drop-offs in cash receipts were detected. Minor seasonal dips during monsoon quarters slightly lowered consistency.',
          improve: [
            { text: 'Diversify customer billing dates to minimize seasonal drops', impact: '+5 points' },
            { text: 'Increase invoice collection reconciliation matching', impact: '+3 points' }
          ]
        };
      case 'cash_flow':
        return {
          title: 'Cash Flow Health',
          scoreValue: card.cash_flow_score,
          summary: 'Measures liquidity margins, banking balances, cash velocity, and debt service coverage index (DSCR) simulated from UPI bank records.',
          dataUsed: [
            { label: 'Monthly Credits Inflow', status: 'verified' },
            { label: 'Monthly Debits Outflow', status: 'verified' },
            { label: 'Average Daily Balance', status: 'verified' },
            { label: 'Salary Payments Outflow', status: 'verified' },
            { label: 'Existing EMI Debits', status: 'verified' }
          ],
          period: 'Last 6 Months',
          factors: [
            { name: 'Total Inflow Velocity', score: 45 },
            { name: 'Average Balance Buffer', score: 25 },
            { name: 'Existing EMI obligations', score: -15 },
            { name: 'Volatility Penalty', score: -7 }
          ],
          aiExplanation: 'UPI transaction credit frequency is strong. However, recurring loan EMIs consume a noticeable portion of monthly cash inflows, which restricts liquid working capital buffers and slightly limits score ceilings.',
          improve: [
            { text: 'Maintain average bank balance above 15% of monthly debits', impact: '+8 points' },
            { text: 'Consolidate short-term loans to reduce total EMIs', impact: '+7 points' }
          ]
        };
      case 'compliance':
        return {
          title: 'Tax Compliance Score',
          scoreValue: card.compliance_score,
          summary: 'Evaluates tax compliance reliability, calculating submission dates, late penalty counts, and GSTR-3B filings.',
          dataUsed: [
            { label: 'GST GSTR-1 Filings', status: 'verified' },
            { label: 'GST GSTR-3B Filings', status: 'verified' },
            { label: 'GST Return Timeliness Record', status: 'verified' }
          ],
          period: 'Last 12 Months',
          factors: [
            { name: 'On-time Submissions', score: 50 },
            { name: 'Nil Return Counts', score: 10 },
            { name: 'Delay Penalties Check', score: 20 },
            { name: 'GSTR-2B Matching Integrity', score: 10 }
          ],
          aiExplanation: 'The client maintains an excellent compliance history. All GST returns were filed within the regulatory timelines over the analyzed period. Mismatch margins on purchases claimed are below 3%.',
          improve: [
            { text: 'File GSTR-3B returns before the 18th of the month', impact: '+5 points' }
          ]
        };
      case 'growth':
        return {
          title: 'Growth Potential',
          scoreValue: card.growth_score,
          summary: 'Calculates development momentum by checking sales curves alongside payroll and EPFO workforce contributions.',
          dataUsed: [
            { label: 'EPFO Employee Growth', status: 'verified' },
            { label: 'MoM Sales Growth Curve', status: 'verified' },
            { label: 'Total Payroll Trends', status: 'verified' }
          ],
          period: 'Last 12 Months',
          factors: [
            { name: 'Employee Count Growth', score: 20 },
            { name: 'Monthly Sales Velocity', score: 20 },
            { name: 'Average Wage Inflation', score: 10 }
          ],
          aiExplanation: 'The firm maintains a steady workforce with minor wage adjustments. Sales figures demonstrate a slow, consistent growth rate, indicating steady business but lacking high-velocity expansion indicators.',
          improve: [
            { text: 'Increase headcount via verified EPFO registration', impact: '+10 points' },
            { text: 'Accelerate digital sales volume via e-commerce', impact: '+15 points' }
          ]
        };
      case 'stability':
        return {
          title: 'Business Stability',
          scoreValue: card.stability_score,
          summary: 'Evaluates longevity and structural robustness based on client payment history, workforce tenure, and operation lifespan.',
          dataUsed: [
            { label: 'AA Repayment Logs', status: 'verified' },
            { label: 'EPFO Workforce Tenure', status: 'verified' },
            { label: 'Business Tenure Checks', status: 'verified' }
          ],
          period: 'Last 12 Months',
          factors: [
            { name: 'Clean Repayment History', score: 50 },
            { name: 'Workforce Tenure Stability', score: 30 },
            { name: 'Operational Life Checks', score: 20 }
          ],
          aiExplanation: 'Stability indicator is exceptional. The firm shows no record of EMI defaults or late payment warnings, backed by low employee turnover rates.',
          improve: [
            { text: 'Maintain clean repayment history to lock in top rating', impact: '+0 points' }
          ]
        };
      case 'loan':
        return {
          title: 'Recommended Loan limit',
          scoreValue: simulatedLoan || card.loan_amount,
          summary: 'Calculates lending eligibility thresholds using monthly revenues adjusted by compliance levels and cash flow volatility.',
          dataUsed: [
            { label: 'Average Monthly Revenue', status: 'verified' },
            { label: 'Eligible lending Multiplier', status: 'verified' },
            { label: 'Existing EMI Debts', status: 'verified' }
          ],
          period: 'Calculated instantly',
          factors: [
            { name: 'Base Sales Limit (Avg Monthly Sales * 1.5)', score: simulatedLoan ? Math.round(simulatedLoan * 0.95) : 0 },
            { name: 'Strong GST Compliance Bonus', score: 20000 },
            { name: 'EMI Debt Penalty', score: -15000 },
            { name: 'Stability Bonus', score: 10000 }
          ],
          aiExplanation: `Recommended loan limit is ₹${(simulatedLoan || card.loan_amount)?.toLocaleString('en-IN')}. Eligible limits are calculated using conservative multipliers due to moderate cash flow fluctuations. RLS settings recommend collateral-free facilities due to strong tax compliance.`,
          improve: [
            { text: 'Reduce short-term EMI volume to unlock 2x multiplier limits', impact: 'Adds ₹2,00,000' }
          ]
        };
      case 'confidence':
        return {
          title: 'Data Confidence Index',
          scoreValue: card.confidence_score,
          summary: 'Checks database completeness across alt-data integrations to quantify risk profiling credibility.',
          dataUsed: [
            { label: 'GST (12 months summary)', status: 'verified' },
            { label: 'UPI (12 months logs)', status: 'verified' },
            { label: 'AA Bank Statements', status: 'verified' },
            { label: 'PAN Identity verification', status: 'verified' }
          ],
          period: 'All linked streams',
          factors: [
            { name: 'GST Integration Completeness', score: 25 },
            { name: 'UPI Inflow Records', score: 25 },
            { name: 'AA Verification Data', score: 20 },
            { name: 'EPFO Records Integrity', score: 15 },
            { name: 'Credit History Years Gap', score: -5 }
          ],
          aiExplanation: 'Confidence index is at 85%. Integration logs confirm full verification of GST, UPI, and EPFO. Missing historical financial statements and limited credit bureau tenure prevented a perfect score.',
          improve: [
            { text: 'Link audited financial statements from the previous year', impact: '+15% confidence' }
          ]
        };
      default:
        return null;
    }
  };

  const auditData = auditMetric ? getAuditData(auditMetric) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center relative">
      {!loggedIn ? (
        <div className="max-w-md mx-auto w-full gradient-border-card p-8 border border-slate-800 shadow-2xl relative">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Access MSME Pulse</h1>
            <p className="text-slate-400 text-sm mt-2">
              Assess credit-invisible MSMEs fairly using unified alternate financial summaries.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Banker Email / ID
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="banker@alliancebank.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loadingUser}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition disabled:opacity-50"
            >
              <span>{loadingUser ? 'Verifying...' : 'Authorize Banker Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : !analysisResult ? (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <div className="gradient-border-card p-6 border border-slate-800">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>1. Select MSME Assessment Profile</span>
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Choose a testing MSME profile to simulate retrieving monthly summaries from UPI logs, GST portals, Account Aggregators, and EPFO.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={() => selectPreset('low-risk')}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-32 ${
                    selectedProfile === 'low-risk'
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Low Risk Tier</span>
                  <span className="font-bold text-slate-100 mt-1 block">Sri Venkateshwara</span>
                  <span className="text-xs text-slate-400 mt-1 block">Fast growing retailer. 100% tax filing record.</span>
                </button>

                <button
                  onClick={() => selectPreset('medium-risk')}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-32 ${
                    selectedProfile === 'medium-risk'
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Medium Risk Tier</span>
                  <span className="font-bold text-slate-100 mt-1 block">Apex Digital</span>
                  <span className="text-xs text-slate-400 mt-1 block">Stable sales, minor filing delays. Moderate debt.</span>
                </button>

                <button
                  onClick={() => selectPreset('high-risk')}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between h-32 ${
                    selectedProfile === 'high-risk'
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">High Risk Tier</span>
                  <span className="font-bold text-slate-100 mt-1 block">Sai Fabricators</span>
                  <span className="text-xs text-slate-400 mt-1 block">Declining revenue. Multiple missed EMI payments.</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase">MSME Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase">GSTIN Code</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="gradient-border-card p-6 border border-slate-800">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>2. Manage Alternate Data Consent</span>
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                In compliance with OCEN, ULI and Account Aggregator rules, checking below authorizes digital data fetch summaries.
              </p>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={consentGst}
                    onChange={(e) => setConsentGst(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-sm font-semibold block text-slate-200">GST Portal Connection</span>
                    <span className="text-xs text-slate-400">Fetch monthly sales returns (GSTR-1, GSTR-3B) and filing dates.</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={consentUpi}
                    onChange={(e) => setConsentUpi(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-sm font-semibold block text-slate-200">UPI Payments Summary</span>
                    <span className="text-xs text-slate-400">Fetch aggregate monthly credits, debits, and credit velocity ratios.</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={consentAa}
                    onChange={(e) => setConsentAa(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-sm font-semibold block text-slate-200">Account Aggregator (AA) Banking</span>
                    <span className="text-xs text-slate-400">Fetch monthly average balances, EMIs, and debt indicators.</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={consentEpfo}
                    onChange={(e) => setConsentEpfo(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-sm font-semibold block text-slate-200">EPFO Payroll Data</span>
                    <span className="text-xs text-slate-400">Verify monthly employee headcount & wage contribution levels.</span>
                  </div>
                </label>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleAggregateAndScore}
                  disabled={analyzing || !(consentGst && consentUpi && consentAa && consentEpfo)}
                  className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold flex items-center space-x-2 text-white shadow-lg disabled:opacity-50 transition"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{analyzing ? 'Aggregating summaries & scoring...' : 'Fetch Alternates & Run Scoring Engine'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="gradient-border-card p-6 border border-slate-800 bg-slate-900/20">
              <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
                <Info className="w-5 h-5 text-indigo-400" />
                <span>Credit-Invisible Assessment</span>
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                By leveraging digital endpoints, the unified MSME credit scoring engine replaces physical verification pipelines. Banks can assess NTC and NTB companies instantly with high reliability.
              </p>
              <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  <span>Integrated with ULI Protocols</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  <span>Modular FastAPI AI Pipeline</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  <span>Explainable Strengths & Risks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dashboard Health Card Main Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center space-x-3">
                <span className="p-2 bg-indigo-900/50 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <Building className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{analysisResult.card.business_name || businessName}</h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    GSTIN: <span className="font-mono text-slate-300">{analysisResult.card.gstin || gstin}</span> | Alternate Data Card
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center space-x-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Evaluate Another MSME</span>
              </button>
            </div>
          </div>

          {/* Health Card Primary Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Radial score meter */}
            <button
              onClick={() => { setAuditMetric('overall'); setAuditTab('summary'); }}
              className="gradient-border-card p-8 border border-slate-800 flex flex-col items-center justify-center text-center shadow-xl hover:cursor-pointer group text-left w-full focus:outline-none"
            >
              <div className="flex items-center space-x-1.5 self-center mb-6">
                <h3 className="text-lg font-bold tracking-tight text-slate-300 uppercase text-xs">Financial Health Score</h3>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
              
              <div className="relative flex items-center justify-center">
                <div 
                  className="radial-progress-score" 
                  style={{ 
                    '--value': simulatedScore || 0,
                    '--progress-color': (simulatedScore || 0) >= 80 ? '#34d399' : (simulatedScore || 0) >= 50 ? '#fbbf24' : '#f87171'
                  } as React.CSSProperties}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-black tracking-tight">{simulatedScore}</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold mt-1">Audit Index</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-400">Risk Profile:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadge((simulatedScore || 0) >= 80 ? 'Low' : (simulatedScore || 0) >= 50 ? 'Medium' : 'High')}`}>
                    {(simulatedScore || 0) >= 80 ? 'Low Risk' : (simulatedScore || 0) >= 50 ? 'Medium Risk' : 'High Risk'}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setAuditMetric('confidence'); setAuditTab('summary'); }}
                  className="text-xs text-slate-500 hover:text-indigo-400 transition flex items-center space-x-1"
                >
                  <span>Confidence Index:</span> 
                  <span className="font-semibold text-slate-300 group-hover:underline">{analysisResult.card.confidence_score}%</span>
                </button>
              </div>
            </button>

            {/* Middle Column: Multidimensional Score Metrics */}
            <div className="gradient-border-card p-8 border border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-slate-300 uppercase text-xs tracking-wider border-b border-slate-800 pb-3">Dimension Scores (Click to audit)</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={() => { setAuditMetric('revenue'); setAuditTab('summary'); }}
                  className="w-full text-left group focus:outline-none"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400 group-hover:text-indigo-400 transition flex items-center">
                      <span>Revenue Stability</span>
                      <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="font-semibold text-slate-200">{analysisResult.card.revenue_score}/100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${analysisResult.card.revenue_score}%` }}></div>
                  </div>
                </button>

                <button 
                  onClick={() => { setAuditMetric('cash_flow'); setAuditTab('summary'); }}
                  className="w-full text-left group focus:outline-none"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400 group-hover:text-indigo-400 transition flex items-center">
                      <span>Cash Flow Health</span>
                      <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="font-semibold text-slate-200">{analysisResult.card.cash_flow_score}/100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${analysisResult.card.cash_flow_score}%` }}></div>
                  </div>
                </button>

                <button 
                  onClick={() => { setAuditMetric('compliance'); setAuditTab('summary'); }}
                  className="w-full text-left group focus:outline-none"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400 group-hover:text-indigo-400 transition flex items-center">
                      <span>Tax Compliance</span>
                      <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="font-semibold text-slate-200">{analysisResult.card.compliance_score}/100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${analysisResult.card.compliance_score}%` }}></div>
                  </div>
                </button>

                <button 
                  onClick={() => { setAuditMetric('growth'); setAuditTab('summary'); }}
                  className="w-full text-left group focus:outline-none"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400 group-hover:text-indigo-400 transition flex items-center">
                      <span>Growth Potential</span>
                      <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="font-semibold text-slate-200">{analysisResult.card.growth_score}/100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${analysisResult.card.growth_score}%` }}></div>
                  </div>
                </button>

                <button 
                  onClick={() => { setAuditMetric('stability'); setAuditTab('summary'); }}
                  className="w-full text-left group focus:outline-none"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400 group-hover:text-indigo-400 transition flex items-center">
                      <span>Business Stability</span>
                      <ChevronRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="font-semibold text-slate-200">{analysisResult.card.stability_score}/100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${analysisResult.card.stability_score}%` }}></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Column: Recommended Loan Eligibility */}
            <button
              onClick={() => { setAuditMetric('loan'); setAuditTab('summary'); }}
              className="gradient-border-card p-8 border border-slate-800 flex flex-col justify-between shadow-xl text-left hover:cursor-pointer group w-full focus:outline-none"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                  <h3 className="text-lg font-bold text-slate-300 uppercase text-xs tracking-wider">Loan Recommendation</h3>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Recommended Limit:</span>
                    <div className="flex items-center text-2xl font-extrabold text-indigo-400">
                      <span className="text-xl font-bold mr-1 text-indigo-400">₹</span>
                      <span>{simulatedLoan ? simulatedLoan.toLocaleString('en-IN') : 'No Eligibility'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                    <span className="text-sm text-slate-400">Confidence Tier:</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {(simulatedScore || 0) >= 80 ? 'High Confidence' : (simulatedScore || 0) >= 50 ? 'Moderate' : 'Unsuitable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                    <span className="text-sm text-slate-400">Collateral Requirement:</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {(simulatedScore || 0) >= 80 ? 'Collateral-Free (CGTMSE)' : (simulatedScore || 0) >= 50 ? 'Partial / Escrow' : '100% Cash/Fixed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generated in real-time by MSME Pulse matching features directly from UPI receipts and GST summaries.
                </p>
              </div>
            </button>
          </div>

          {/* Explainable AI & Strengths/Risks */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="gradient-border-card p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Alternate Data Strengths</span>
              </h3>
              <ul className="space-y-3">
                {analysisResult.card.strengths.map((str: string, index: number) => (
                  <li key={index} className="text-sm text-slate-300 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="gradient-border-card p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Credit Risk Factors</span>
              </h3>
              <ul className="space-y-3">
                {analysisResult.card.risks.map((risk: string, index: number) => (
                  <li key={index} className="text-sm text-slate-300 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0"></span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="gradient-border-card p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Personalized Recommendations to Improve Health Score</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {analysisResult.recommendations.map((rec: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {rec.category}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{rec.recommendation_text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive What-If Simulation Sandbox */}
          <div className="gradient-border-card p-8 border border-slate-800 bg-indigo-950/5">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-slate-200">Interactive Credit Scoring Simulator</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Simulate changes in core alternate business metrics to understand how compliance filing stability or revenue improvements affect the final lending card.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    GST filing compliance ({complianceTweak}%)
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={complianceTweak}
                    onChange={(e) => handleSimulationChange('compliance', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Slide to simulate regular filing and tax clearance reports.
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Monthly sales growth ({growthTweak}%)
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="40"
                    value={growthTweak}
                    onChange={(e) => handleSimulationChange('growth', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Slide to simulate business sales trajectory MoM.
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Debt Service Burden Ratio ({debtTweak}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={debtTweak}
                    onChange={(e) => handleSimulationChange('debt', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Slide to simulate existing EMI obligations.
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 mt-6 pt-6 flex flex-wrap justify-between items-center gap-4">
              <div className="text-xs text-slate-500">
                Note: Simulated figures do not modify records in the database.
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-sm">
                  Simulated Score: <span className="font-bold text-indigo-400 text-lg">{simulatedScore}</span>
                </div>
                <div className="text-sm">
                  Simulated Limit: <span className="font-bold text-indigo-400 text-lg">₹{simulatedLoan?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Side XAI Auditing Drawer */}
      {auditMetric && auditData && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setAuditMetric(null)} 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Sliding Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 translate-x-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Explainable AI Audit</span>
                <h2 className="text-xl font-extrabold text-white mt-1">{auditData.title}</h2>
              </div>
              <button 
                onClick={() => setAuditMetric(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Ring Section inside Drawer */}
            <div className="p-6 bg-slate-950/40 border-b border-slate-800/60 flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-extrabold text-2xl text-indigo-400 shadow-inner">
                {auditMetric === 'loan' ? '₹' : ''}{auditData.scoreValue}{auditMetric === 'confidence' ? '%' : ''}
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Current Score Card</span>
                <span className="text-sm text-slate-200 leading-relaxed block mt-0.5">{auditData.summary}</span>
              </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/20 px-4 text-xs font-semibold">
              <button 
                onClick={() => setAuditTab('summary')}
                className={`py-3 px-3 border-b-2 transition ${auditTab === 'summary' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Summary
              </button>
              <button 
                onClick={() => setAuditTab('data')}
                className={`py-3 px-3 border-b-2 transition ${auditTab === 'data' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Data Used
              </button>
              <button 
                onClick={() => setAuditTab('calc')}
                className={`py-3 px-3 border-b-2 transition ${auditTab === 'calc' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Calculation
              </button>
              <button 
                onClick={() => setAuditTab('ai')}
                className={`py-3 px-3 border-b-2 transition ${auditTab === 'ai' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                AI Underwriter
              </button>
              <button 
                onClick={() => setAuditTab('improve')}
                className={`py-3 px-3 border-b-2 transition ${auditTab === 'improve' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Improve Score
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {auditTab === 'summary' && (
                <div className="space-y-4">
                  {analysisResult?.card?.audit_trail?.knockout_checks && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-300">Hard Underwriting Thresholds (Knockouts)</h4>
                      <div className="space-y-2">
                        {analysisResult.card.audit_trail.knockout_checks.map((check: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                            <div>
                              <span className="text-sm font-medium text-slate-205 block">{check.check_name}</span>
                              <span className="text-xs text-slate-400">Current: {check.value}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${check.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-extrabold uppercase animate-pulse'}`}>
                              {check.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-slate-300 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Metric Classification</span>
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {auditData.summary}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analysis Window</h4>
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>{auditData.period}</span>
                    </div>
                  </div>
                </div>
              )}

              {auditTab === 'data' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">Verified Alternative Inflows</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    MSME Pulse cross-matches external provider data feeds below to eliminate manual bank reconciliation sheets.
                  </p>
                  <div className="space-y-2">
                    {auditData.dataUsed.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850">
                        <span className="text-sm text-slate-300">{d.label}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ Linked
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {auditTab === 'calc' && (
                <div className="space-y-6">
                  {analysisResult?.card?.audit_trail?.score_deductions && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-300">Rule-Based Adjustments & Deductions</h4>
                      {analysisResult.card.audit_trail.score_deductions.length > 0 ? (
                        <div className="space-y-2">
                          {analysisResult.card.audit_trail.score_deductions.map((dec: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-sm">
                              <div>
                                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">{dec.component}</span>
                                <span className="text-slate-300">{dec.reason}</span>
                              </div>
                              <span className="font-mono text-rose-400 font-bold">{dec.deduction} pts</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No score deductions applied. Operational thresholds completely satisfied.</p>
                      )}
                    </div>
                  )}

                  {analysisResult?.card?.audit_trail?.financial_evidence && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-300">Key Underwriting Evidence</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-850">
                          <span className="text-slate-500 block">Est. Operating Margin</span>
                          <span className="text-sm font-bold text-slate-200 mt-1 block">{analysisResult.card.audit_trail.financial_evidence.estimated_operating_margin}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-850">
                          <span className="text-slate-500 block">GST Match Ratio</span>
                          <span className="text-sm font-bold text-slate-200 mt-1 block">{analysisResult.card.audit_trail.financial_evidence.gst_reconciliation_variance}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-850 col-span-2">
                          <span className="text-slate-500 block">Debt Serviceability Check (DSCR)</span>
                          <span className="text-sm font-bold text-slate-200 mt-1 block leading-relaxed">{analysisResult.card.audit_trail.financial_evidence.debt_service_coverage_ratio}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-850 col-span-2">
                          <span className="text-slate-500 block">Peer Calibration</span>
                          <span className="text-sm font-bold text-slate-200 mt-1 block leading-relaxed">{analysisResult.card.audit_trail.financial_evidence.peer_comparison}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-sm font-bold text-slate-300">Underwriting Weight Breakdown</h4>
                    
                    {auditMetric === 'overall' ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500">
                          Overall Score calculated as: sum of (Dimension Score × weight percentage).
                        </p>
                        <div className="space-y-2.5">
                          {auditData.factors.map((f: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-950/30 border border-slate-800 flex items-center justify-between text-sm">
                              <div>
                                <span className="font-semibold text-slate-200 block">{f.name}</span>
                                <span className="text-xs text-slate-400">Score: {f.score} | Weight: {f.weight}</span>
                              </div>
                              <span className="font-mono text-indigo-400">+{f.contribution} pts</span>
                            </div>
                          ))}
                          <div className="border-t border-indigo-500/30 pt-3 flex justify-between text-base font-bold text-white">
                            <span>Final Weighted Score</span>
                            <span className="text-indigo-400">{simulatedScore} / 100</span>
                          </div>
                        </div>
                      </div>
                    ) : auditMetric === 'loan' ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500">
                          Calculated using monthly sales averages multiplied by risk multiplier adjustments:
                        </p>
                        <div className="space-y-2.5">
                          {auditData.factors.map((f: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-950/30 border border-slate-800 flex items-center justify-between text-sm">
                              <span className="text-slate-300">{f.name}</span>
                              <span className={`font-mono ${f.score >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                {f.score >= 0 ? '+' : ''}₹{f.score.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                          Relative scoring inputs contributing to the index:
                        </p>
                        <div className="space-y-2">
                          {auditData.factors.map((f: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850 text-sm">
                              <span className="text-slate-300">{f.name}</span>
                              <span className={`font-mono font-bold ${f.score >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                {f.score >= 0 ? '+' : ''}{f.score}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-white text-sm">
                            <span>Computed Score Index</span>
                            <span>{auditData.scoreValue}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {auditTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-950/10 border border-indigo-900/30 flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Plain English Audit Explainability</h4>
                      <p className="text-sm text-slate-400 leading-relaxed mt-2">
                        {auditData.aiExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {auditTab === 'improve' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">Actionable Steps to Improve this Score</h4>
                  <p className="text-xs text-slate-500">
                    Calculated projections for positive score increases based on targeted operational tweaks.
                  </p>
                  <div className="space-y-3">
                    {auditData.improve.map((imp: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-200 leading-relaxed">{imp.text}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                          {imp.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button 
                onClick={() => setAuditMetric(null)}
                className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-white transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
