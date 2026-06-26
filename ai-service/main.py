import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from feature_engineering.feature_engineering import engineer_all_features
from scoring.scoring import calculate_scores
from explainability.explainability import generate_explanations
from explainability.recommendations import generate_recommendations

app = FastAPI(title="MSME Pulse AI Scoring Engine", version="1.0.0")

# Enable CORS for Next.js app interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GstItem(BaseModel):
    month: str
    monthly_sales: float
    monthly_purchases: float
    gst_filing_status: str
    filing_date: Optional[str] = None
    gstr1_sales: Optional[float] = None
    gstr3b_sales: Optional[float] = None

class UpiItem(BaseModel):
    month: str
    total_credits: float
    total_debits: float
    num_transactions: int
    avg_transaction_value: float

class AaItem(BaseModel):
    month: str
    average_balance: float
    monthly_credits: float
    monthly_debits: float
    existing_emi: float
    loan_repayment_status: str

class EpfoItem(BaseModel):
    month: str
    employee_count: int
    payroll: float
    employer_contribution: float

class ScoringInput(BaseModel):
    gst: List[GstItem]
    upi: List[UpiItem]
    aa: List[AaItem]
    epfo: List[EpfoItem]
    cibil_score: Optional[int] = 700
    cheque_bounces_3m: Optional[int] = 0
    gst_filing_delay_days: Optional[int] = 0
    industry_growth_rate: Optional[float] = 10.0

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "MSME Pulse AI Engine"}

@app.post("/score")
def generate_health_card(payload: ScoringInput):
    try:
        # Convert Pydantic list models to basic dictionaries
        raw_data = {
            "gst": [item.model_dump() for item in payload.gst],
            "upi": [item.model_dump() for item in payload.upi],
            "aa": [item.model_dump() for item in payload.aa],
            "epfo": [item.model_dump() for item in payload.epfo],
        }
        
        # 1. Feature Engineering
        features = engineer_all_features(raw_data)
        
        # Add the root input parameters to features
        features["cibil_score"] = payload.cibil_score if payload.cibil_score is not None else 700
        features["cheque_bounces_3m"] = payload.cheque_bounces_3m if payload.cheque_bounces_3m is not None else 0
        features["gst_filing_delay_days"] = payload.gst_filing_delay_days if payload.gst_filing_delay_days is not None else 0
        features["industry_growth_rate"] = payload.industry_growth_rate if payload.industry_growth_rate is not None else 10.0
        
        # 2. Score Calculation
        scores = calculate_scores(features)
        
        # 3. Explainability
        explanations = generate_explanations(features, scores)
        
        # 4. Actionable recommendations
        recs = generate_recommendations(features, scores)
        
        return {
            "features": features,
            "scores": scores,
            "explainability": explanations,
            "recommendations": recs
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
