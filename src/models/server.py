from fastapi import FastAPI, Response
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

@app.get("/predict")
def predict():
    model = FinancialPredictor()
    result = model.predict_next_month("Dataset/company_finances_daily_2022_2025.csv")
    return result

@app.get("/predict/year")
def predict_year():
    model = FinancialPredictor()
    result = model.predict_next_year("Dataset/company_finances_daily_2022_2025.csv")
    return result

@app.get("/data/csv")
def get_csv():
    """Serve the CSV content for the frontend to fetch through backend."""
    csv_path = os.path.join(os.path.dirname(__file__), "Dataset", "company_finances_daily_2022_2025.csv")
    if not os.path.exists(csv_path):
        return {"error": "CSV file not found"}
    with open(csv_path, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content, media_type="text/csv")