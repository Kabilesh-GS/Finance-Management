from fastapi import FastAPI, HTTPException
from fastapi import Request
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from FinancePred import FinancialPredictor
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict_from_csv(request: Request):
    """Get predictions from uploaded CSV data. CSV data is required."""
    try:
        csv_content = await request.body()
        csv_text = csv_content.decode("utf-8")
        
        if not csv_text or len(csv_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="CSV data is required. Please upload a CSV file.")
        
        model = FinancialPredictor()
        result = model.predict_next_month(csv_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV data: {str(e)}")

@app.post("/predict/year")
async def predict_year_from_csv(request: Request):
    """Get yearly predictions from uploaded CSV data. CSV data is required."""
    try:
        csv_content = await request.body()
        csv_text = csv_content.decode("utf-8")
        
        if not csv_text or len(csv_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="CSV data is required. Please upload a CSV file.")
        
        model = FinancialPredictor()
        result = model.predict_next_year(csv_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV data: {str(e)}")