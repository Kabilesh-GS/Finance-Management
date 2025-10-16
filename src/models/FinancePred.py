import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

class FinancialPredictor:
    def __init__(self):
        self.model_income = LinearRegression()
        self.model_expenses = LinearRegression()

    def preprocess(self, csv_path):
        # Load CSV - handle both relative and absolute paths
        import os
        if not os.path.isabs(csv_path):
            # If relative path, look relative to current file location
            csv_path = os.path.join(os.path.dirname(__file__), csv_path)
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
        monthly["expenses_total"] = monthly[["payroll", "rent", "utilities", "technology", "marketing", "travel", "professional_services", "misc"]].sum(axis=1)
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
        
        X = df[['time_idx']]
        self.model_income.fit(X, df['income_total'])
        self.model_expenses.fit(X, df['expenses_total'])

        # Predict next 12 months
        monthly_predictions = []
        total_income = 0
        total_expenses = 0
        
        for i in range(1, 13):  # Next 12 months
            next_idx = np.array([[df['time_idx'].iloc[-1] + i]])
            income_pred = int(self.model_income.predict(next_idx)[0])
            expenses_pred = int(self.model_expenses.predict(next_idx)[0])
            savings_pred = income_pred - expenses_pred
            
            # Calculate the month name
            month_date = last_month + pd.DateOffset(months=i)
            month_name = month_date.strftime("%Y-%m")
            
            monthly_predictions.append({
                "month": month_name,
                "income": income_pred,
                "expenses": expenses_pred,
                "savings": savings_pred
            })
            
            total_income += income_pred
            total_expenses += expenses_pred

        total_savings = total_income - total_expenses
        confidence = self.calculate_confidence(df, "expenses_total")

        insights = []
        avg_savings_rate = total_savings / total_income if total_income > 0 else 0
        insights.append({
            "type": "info",
            "message": f"Average predicted savings rate over 12 months: {avg_savings_rate:.1%}"
        })
        
        avg_monthly_expenses = total_expenses / 12
        avg_monthly_income = total_income / 12
        
        if avg_monthly_expenses > df['expenses_total'].mean() * 1.2:
            insights.append({
                "type": "warning",
                "message": "Average monthly expenses are projected above the recent average"
            })
        if avg_monthly_income < df['income_total'].mean() * 0.8:
            insights.append({
                "type": "warning",
                "message": "Average monthly income is projected below the recent average"
            })

        return {
            "monthly_predictions": monthly_predictions,
            "summary": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_savings": total_savings,
                "avg_monthly_income": int(total_income / 12),
                "avg_monthly_expenses": int(total_expenses / 12),
                "avg_monthly_savings": int(total_savings / 12),
                "confidence": confidence
            },
            "insights": insights
        }

    def predict_next_year(self, csv_path):
        df = self.preprocess(csv_path)

        # Calculate yearly predictions by predicting next 12 months
        X = df[['time_idx']]
        self.model_income.fit(X, df['income_total'])
        self.model_expenses.fit(X, df['expenses_total'])

        # Predict next 12 months and sum them up
        yearly_income = 0
        yearly_expenses = 0
        
        for i in range(1, 13):  # Next 12 months
            next_idx = np.array([[df['time_idx'].iloc[-1] + i]])
            monthly_income = self.model_income.predict(next_idx)[0]
            monthly_expenses = self.model_expenses.predict(next_idx)[0]
            
            yearly_income += monthly_income
            yearly_expenses += monthly_expenses

        yearly_savings = yearly_income - yearly_expenses
        confidence = self.calculate_confidence(df, "expenses_total")

        insights = []
        savings_rate = yearly_savings / yearly_income if yearly_income > 0 else 0
        insights.append({
            "type": "info",
            "message": f"Predicted annual savings rate: {savings_rate:.1%}"
        })
        
        # Compare with historical averages
        avg_monthly_income = df['income_total'].mean()
        avg_monthly_expenses = df['expenses_total'].mean()
        
        if yearly_expenses / 12 > avg_monthly_expenses * 1.2:
            insights.append({
                "type": "warning",
                "message": "Annual expenses are projected significantly above historical average"
            })
        if yearly_income / 12 < avg_monthly_income * 0.8:
            insights.append({
                "type": "warning",
                "message": "Annual income is projected below historical average"
            })

        return {
            "predictions": {
                "income": int(yearly_income),
                "expenses": int(yearly_expenses),
                "savings": int(yearly_savings),
                "confidence": confidence
            },
            "insights": insights
        }