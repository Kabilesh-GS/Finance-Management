from fastapi import FastAPI
import json
from FinancePred import FinancialPredictor
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for stricter rules
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/predict")
def predict():
    model = FinancialPredictor()
    result = model.predict_next_month("D:\Projects\Finance Management\public\company_finances_daily_2024_2025.csv")
    return result
