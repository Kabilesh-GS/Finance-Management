import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

class FinancialPredictor:
    def __init__(self):
        self.model_income = LinearRegression()
        self.model_expenses = LinearRegression()

    def preprocess(self, csv_path):
        # Load CSV
        df = pd.read_csv(csv_path, parse_dates=["date"])
        
        # Extract month as YYYY-MM
        df['month'] = df['date'].dt.to_period("M").astype(str)

        # Aggregate daily → monthly
        monthly = df.groupby("month").agg({
            "sales": "sum",
            "consulting": "sum",
            "investment": "sum",
            "payroll": "sum",
            "rent": "sum",
            "utilities": "sum",
            "technology": "sum",
            "marketing": "sum",
            "travel": "sum",
            "professional_services": "sum",
            "misc": "sum"
        }).reset_index()

        # Totals
        monthly["income_total"] = monthly[["sales", "consulting", "investment"]].sum(axis=1)
        monthly["expenses_total"] = monthly[["payroll", "rent", "utilities", "technology", 
                                             "marketing", "travel", "professional_services", "misc"]].sum(axis=1)
        monthly["savings"] = monthly["income_total"] - monthly["expenses_total"]
        monthly["time_idx"] = np.arange(len(monthly))

        return monthly

    def calculate_confidence(self, df, target="expenses_total"):
        if len(df) < 2:
            return 0.3

        X = df[['time_idx']]
        y = df[target]
        model = LinearRegression().fit(X, y)
        y_pred = model.predict(X)

        r2 = max(0, r2_score(y, y_pred))
        n = len(df)
        base = 0.6 if n < 6 else (0.75 if n < 12 else 0.85)

        confidence = 0.5 * base + 0.5 * (0.3 + 0.7 * r2)
        return round(min(confidence, 0.99), 2)

    def predict_next_month(self, csv_path):
        df = self.preprocess(csv_path)

        last_month = pd.to_datetime(df['month'].iloc[-1])
        next_month = (last_month + pd.DateOffset(months=1)).strftime("%Y-%m")

        X = df[['time_idx']]
        self.model_income.fit(X, df['income_total'])
        self.model_expenses.fit(X, df['expenses_total'])

        next_idx = np.array([[df['time_idx'].iloc[-1] + 1]])
        income_pred = int(self.model_income.predict(next_idx)[0])
        expenses_pred = int(self.model_expenses.predict(next_idx)[0])
        savings_pred = income_pred - expenses_pred

        confidence = self.calculate_confidence(df, "expenses_total")

        insights = []
        savings_rate = savings_pred / income_pred if income_pred > 0 else 0
        insights.append({
            "type": "info",
            "message": f"Predicted savings rate: {savings_rate:.1%}"
        })
        if expenses_pred > df['expenses_total'].mean() * 1.2:
            insights.append({
                "type": "warning",
                "message": "Expenses are projected above the recent average"
            })
        if income_pred < df['income_total'].mean() * 0.8:
            insights.append({
                "type": "warning",
                "message": "Income is projected below the recent average"
            })

        return {
            "month": next_month,
            "predictions": {
                "income": income_pred,
                "expenses": expenses_pred,
                "savings": savings_pred,
                "confidence": confidence
            },
            "insights": insights
        }
