import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

import logging
logging.getLogger("statsmodels").setLevel(logging.ERROR)

from statsmodels.tsa.statespace.sarimax import SARIMAX

class FinancialPredictor:
    def __init__(self):
        self.model_income = None
        self.model_expenses = None

    def preprocess(self, csv_input):
        """
        Preprocess CSV data. csv_input can be:
        - A file path (string)
        - CSV content (string)
        - A pandas DataFrame
        """
        import os
        from io import StringIO
        
        # If it's a DataFrame, use it directly
        if isinstance(csv_input, pd.DataFrame):
            df = csv_input.copy()
        # If it's a file path (string and exists as file)
        elif isinstance(csv_input, str) and os.path.exists(csv_input):
            csv_path = csv_input
            if not os.path.isabs(csv_path):
                csv_path = os.path.join(os.path.dirname(__file__), csv_path)
            df = pd.read_csv(csv_path, parse_dates=["date"])
        # If it's CSV content (string)
        else:
            df = pd.read_csv(StringIO(csv_input), parse_dates=["date"])
        
        df["month"] = df["date"].dt.to_period("M").astype(str)

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
        monthly["month_dt"] = pd.to_datetime(monthly["month"])
        monthly = monthly.sort_values("month_dt").reset_index(drop=True)

        return monthly

    def optimized_sarima(self, series, seasonal_period=12):
        """
        Optimize SARIMA model by testing different parameter combinations and selecting the best one based on AIC.
        """
        import warnings
        import logging
        warnings.filterwarnings("ignore")
        logging.getLogger("statsmodels").setLevel(logging.ERROR)

        p = d = q = [0, 1, 2]
        P = Q = [0, 1]

        if series.diff().abs().mean() > series.abs().mean() * 0.01:
            D_options = [0, 1]
        else:
            D_options = [1]

        best_aic = float("inf")
        best_model = None
        best_cfg = None

        print("⚡ Optimized SARIMA tuning...")

        for order in [(p_, d_, q_) for p_ in p for d_ in d for q_ in q]:
            if order == (0, 0, 0):
                continue

            for seasonal in [(P_, D_, Q_) for P_ in P for D_ in D_options for Q_ in Q]:
                seasonal_order = seasonal + (seasonal_period,)

                try:
                    model = SARIMAX(
                        series,
                        order=order,
                        seasonal_order=seasonal_order,
                        enforce_stationarity=True,
                        enforce_invertibility=True
                    ).fit(
                        method="powell",
                        maxiter=50,
                        disp=False
                    )

                    if model.aic < best_aic:
                        best_aic = model.aic
                        best_model = model
                        best_cfg = (order, seasonal_order)

                except Exception:
                    continue

        print("🔥 Best SARIMA:", best_cfg, "| AIC:", best_aic)
        return best_model if best_model else SARIMAX(series, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12)).fit(disp=False)

    def calculate_confidence(self, model, series, forecast):
        """
        Calculate confidence score based on SARIMA model quality.
        """
        try:
            # 1. AIC normalization (lower AIC = better)
            aic = model.aic
            aic_score = np.exp(-aic / 10000)

            # 2. Residual variance (lower variance = more stable)
            residuals = model.resid
            var = np.var(residuals)
            var_score = np.exp(-var / (np.mean(series)**2 + 1e-8))

            # 3. Forecast standard errors (model uncertainty)
            try:
                _, se = model.get_forecast(steps=len(forecast)).summary_frame()[["mean", "mean_se"]].values.T
                se_score = np.exp(-np.mean(se) / (np.mean(series) + 1e-8))
            except:
                se_score = 0.5

            # Combine scores
            confidence = (0.4 * aic_score) + (0.3 * var_score) + (0.3 * se_score)
            confidence = float(max(0.05, min(confidence, 0.99)))
            return confidence
        except Exception:
            # Fallback confidence
            return 0.7

    def predict_next_month(self, csv_input):
        """
        Predict next 12 months using SARIMA model. csv_input can be file path, CSV string, or DataFrame.
        """
        df = self.preprocess(csv_input)

        income_series = df["income_total"]
        expenses_series = df["expenses_total"]

        self.model_income = self.optimized_sarima(income_series)
        self.model_expenses = self.optimized_sarima(expenses_series)

        income_pred = self.model_income.forecast(12)
        expenses_pred = self.model_expenses.forecast(12)

        last_month = df["month_dt"].iloc[-1]
        predictions = []

        total_income = 0
        total_expenses = 0

        for i in range(1, 13):
            dt = last_month + pd.DateOffset(months=i)
            # Ensure values are integers (not floats)
            inc = int(round(income_pred.iloc[i-1]))
            exp = int(round(expenses_pred.iloc[i-1]))
            sav = int(inc - exp)

            predictions.append({
                "month": dt.strftime("%Y-%m"),
                "income": inc,
                "expenses": exp,
                "savings": sav
            })

            total_income += inc
            total_expenses += exp

        total_savings = int(total_income - total_expenses)
        total_income = int(total_income)
        total_expenses = int(total_expenses)

        historical_income_avg = income_series.mean()
        historical_expenses_avg = expenses_series.mean()
        historical_savings_avg = (income_series - expenses_series).mean()

        future_income_avg = np.mean(income_pred)
        future_expenses_avg = np.mean(expenses_pred)
        future_savings_avg = future_income_avg - future_expenses_avg

        def trend_text(name, past, future):
            change = ((future - past) / past) * 100 if past != 0 else 0

            if change > 5:
                return f"{name} is expected to increase compared to usual (+{change:.1f}%)."
            elif change < -5:
                return f"{name} is expected to decrease compared to usual ({change:.1f}%)."
            else:
                return f"{name} is expected to stay roughly the same as usual."

        trend_insights = [
            {"type": "trend", "message": trend_text("Income", historical_income_avg, future_income_avg)},
            {"type": "trend", "message": trend_text("Expenses", historical_expenses_avg, future_expenses_avg)},
            {"type": "trend", "message": trend_text("Savings", historical_savings_avg, future_savings_avg)}
        ]

        all_insights = [
            {"type": "info", "message": "Optimized SARIMA model applied successfully 🔥"},
            {"type": "info", "message": "Best model selected using lowest AIC."}
        ] + trend_insights

        confidence = round(
            (
                self.calculate_confidence(self.model_income, income_series, income_pred) +
                self.calculate_confidence(self.model_expenses, expenses_series, expenses_pred)
            ) / 2,
            2
        )

        return {
            "monthly_predictions": predictions,
            "summary": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_savings": total_savings,
                "avg_monthly_income": int(total_income / 12),
                "avg_monthly_expenses": int(total_expenses / 12),
                "avg_monthly_savings": int(total_savings / 12),
                "confidence": confidence
            },
            "insights": all_insights
        }

    def predict_next_year(self, csv_input):
        """
        Predict next year using SARIMA model. csv_input can be file path, CSV string, or DataFrame.
        """
        df = self.preprocess(csv_input)

        income_series = df["income_total"]
        expenses_series = df["expenses_total"]

        self.model_income = self.optimized_sarima(income_series)
        self.model_expenses = self.optimized_sarima(expenses_series)

        income_pred = self.model_income.forecast(12)
        expenses_pred = self.model_expenses.forecast(12)

        yearly_income = int(np.sum(income_pred))
        yearly_expenses = int(np.sum(expenses_pred))
        yearly_savings = yearly_income - yearly_expenses

        confidence = round(
            (
                self.calculate_confidence(self.model_income, income_series, income_pred) +
                self.calculate_confidence(self.model_expenses, expenses_series, expenses_pred)
            ) / 2,
            2
        )

        insights = []
        savings_rate = yearly_savings / yearly_income if yearly_income > 0 else 0
        insights.append({
            "type": "info",
            "message": f"Predicted annual savings rate: {savings_rate:.1%}"
        })
        
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
                "income": yearly_income,
                "expenses": yearly_expenses,
                "savings": yearly_savings,
                "confidence": confidence
            },
            "insights": insights
        }
