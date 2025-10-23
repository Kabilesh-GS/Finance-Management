import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Info,
  Target,
} from "lucide-react";
import "./Predictions.css";

const Predictions = ({ transactions }) => {
  const [predictions, setPredictions] = useState(null);
  const [yearlyPredictions, setYearlyPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("monthly");

  useEffect(() => {
    let cancelled = false;
    async function loadPredictions() {
      try {
        setLoading(true);
        // Try Python backend first
        const resp = await fetch(
          process.env.REACT_APP_PY_API_BASE
            ? `${process.env.REACT_APP_PY_API_BASE}/predict`
            : "/py/predict",
          { method: "GET" }
        );
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) {
            setPredictions(data);
            // For yearly from Python
            try {
              const yResp = await fetch(
                process.env.REACT_APP_PY_API_BASE
                  ? `${process.env.REACT_APP_PY_API_BASE}/predict/year`
                  : "/py/predict/year"
              );
              if (yResp.ok) {
                const yData = await yResp.json();
                setYearlyPredictions(yData);
              } else {
                // fallback yearly computed from monthly
                setYearlyPredictions(
                  computeYearlySummary(data.monthly_predictions)
                );
              }
              setError(null);
            } catch (_) {
              setYearlyPredictions(
                computeYearlySummary(data.monthly_predictions)
              );
            }
          }
        } else {
          // Fallback to JS model
          const computed = computeMonthlyPredictions(transactions || []);
          const yearly = computeYearlySummary(computed.monthly_predictions);
          if (!cancelled) {
            setPredictions(computed);
            setYearlyPredictions(yearly);
            setError(null);
          }
        }
      } catch (e) {
        const computed = computeMonthlyPredictions(transactions || []);
        const yearly = computeYearlySummary(computed.monthly_predictions);
        if (!cancelled) {
          setPredictions(computed);
          setYearlyPredictions(yearly);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPredictions();
    return () => {
      cancelled = true;
    };
  }, [transactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Chat moved to dedicated ChatBot component

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "#10b981"; // green
    if (confidence >= 0.6) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  // Simple helpers to compute per-user predictions locally
  const monthKey = (isoDate) => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const aggregateByMonth = (tx) => {
    const map = new Map();
    tx.forEach((t) => {
      const key = monthKey(t.date);
      if (!key) return;
      const entry = map.get(key) || { income: 0, expenses: 0 };
      if (t.type === "income") entry.income += Number(t.amount) || 0;
      if (t.type === "expense") entry.expenses += Number(t.amount) || 0;
      map.set(key, entry);
    });
    const rows = Array.from(map.entries())
      .map(([month, v]) => ({ month, income: v.income, expenses: v.expenses }))
      .sort((a, b) => (a.month < b.month ? -1 : 1));
    return rows;
  };

  const linearTrendNext = (values) => {
    // Very small linear regression over index to project next value
    const n = values.length;
    if (n === 0) return 0;
    if (n === 1) return values[0];
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
      const x = i + 1;
      const y = values[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const intercept = sumY / n - slope * (sumX / n);
    const nextX = n + 1;
    return intercept + slope * nextX;
  };

  const computeConfidence = (histLen) => {
    if (histLen >= 12) return 0.8;
    if (histLen >= 6) return 0.65;
    if (histLen >= 3) return 0.5;
    return 0.35;
  };

  const nextMonthKey = (lastKey) => {
    const [y, m] = lastKey.split("-").map((n) => parseInt(n, 10));
    const date = new Date(y, m - 1, 1);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const computeMonthlyPredictions = (tx) => {
    const monthly = aggregateByMonth(tx);
    const incomeSeries = monthly.map((r) => r.income);
    const expenseSeries = monthly.map((r) => r.expenses);

    // Start from next month after last historical (or current month if none)
    let currentMonth = monthly.length
      ? nextMonthKey(monthly[monthly.length - 1].month)
      : monthKey(new Date().toISOString());

    const monthly_predictions = [];
    for (let i = 0; i < 12; i++) {
      const nextIncome = Math.max(0, linearTrendNext(incomeSeries));
      const nextExpenses = Math.max(0, linearTrendNext(expenseSeries));
      const nextSavings = nextIncome - nextExpenses;
      monthly_predictions.push({
        month: currentMonth,
        income: nextIncome,
        expenses: nextExpenses,
        savings: nextSavings,
      });
      // Append predicted values to influence subsequent months
      incomeSeries.push(nextIncome);
      expenseSeries.push(nextExpenses);
      currentMonth = nextMonthKey(currentMonth);
    }

    const histIncomeAvg = monthly.length
      ? monthly.reduce((sum, r) => sum + r.income, 0) / monthly.length
      : 0;
    const histExpenseAvg = monthly.length
      ? monthly.reduce((sum, r) => sum + r.expenses, 0) / monthly.length
      : 0;
    const avg_monthly_income = histIncomeAvg;
    const avg_monthly_expenses = histExpenseAvg;
    const avg_monthly_savings = avg_monthly_income - avg_monthly_expenses;
    const confidence = computeConfidence(monthly.length);

    const insights = [];
    // Compare first projected month to historical average
    if (monthly_predictions[0].expenses > monthly_predictions[0].income) {
      insights.push({
        type: "warning",
        message: "Projected expenses exceed income next month.",
      });
    } else if (
      monthly_predictions[0].savings > avg_monthly_savings &&
      monthly.length > 0
    ) {
      insights.push({
        type: "info",
        message: "Projected savings trend is improving.",
      });
    }

    return {
      monthly_predictions,
      summary: {
        avg_monthly_income,
        avg_monthly_expenses,
        avg_monthly_savings,
        confidence,
      },
      insights,
    };
  };

  const computeYearlySummary = (monthly_predictions) => {
    const baseMonths = monthly_predictions || [];
    // Ensure we have 24 months by projecting forward from the provided series
    const months = [...baseMonths];
    let lastMonthKey = months.length
      ? months[months.length - 1].month
      : monthKey(new Date().toISOString());
    let incomeSeries = months.map((m) => m.income);
    let expenseSeries = months.map((m) => m.expenses);
    while (months.length < 24) {
      const nextIncome = Math.max(0, linearTrendNext(incomeSeries));
      const nextExpenses = Math.max(0, linearTrendNext(expenseSeries));
      lastMonthKey = nextMonthKey(lastMonthKey);
      months.push({
        month: lastMonthKey,
        income: nextIncome,
        expenses: nextExpenses,
        savings: nextIncome - nextExpenses,
      });
      incomeSeries.push(nextIncome);
      expenseSeries.push(nextExpenses);
    }

    const sumRange = (arr, start, end) =>
      arr.slice(start, end).reduce((s, m) => s + (m || 0), 0);

    const year1Income = sumRange(
      months.map((m) => m.income),
      0,
      12
    );
    const year1Expenses = sumRange(
      months.map((m) => m.expenses),
      0,
      12
    );
    const year1Savings = year1Income - year1Expenses;
    const year2Income = sumRange(
      months.map((m) => m.income),
      12,
      24
    );
    const year2Expenses = sumRange(
      months.map((m) => m.expenses),
      12,
      24
    );
    const year2Savings = year2Income - year2Expenses;

    const year1 = {
      income: year1Income,
      expenses: year1Expenses,
      savings: year1Savings,
      confidence: computeConfidence(baseMonths.length + 6),
    };
    const year2 = {
      income: year2Income,
      expenses: year2Expenses,
      savings: year2Savings,
      confidence: computeConfidence(baseMonths.length + 12),
    };
    return { predictions: [year1, year2] };
  };

  const renderInsightIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="insight-icon warning" size={16} />;
      case "info":
        return <Info className="insight-icon info" size={16} />;
      default:
        return <Info className="insight-icon info" size={16} />;
    }
  };

  const renderPredictionCard = (title, value, icon, trend = null) => (
    <div className="prediction-card">
      <div className="prediction-header">
        <div className="prediction-icon">{icon}</div>
        <h3 className="prediction-title">{title}</h3>
      </div>
      <div className="prediction-value">{formatCurrency(value)}</div>
      {trend && (
        <div
          className={`prediction-trend ${trend > 0 ? "positive" : "negative"}`}
        >
          {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );

  const renderMonthlyPredictions = () => {
    if (!predictions) return null;

    const { monthly_predictions, summary, insights } = predictions;

    return (
      <div className="predictions-content">
        <div className="predictions-header">
          <h2>Monthly Predictions</h2>
          <div className="prediction-month">
            <Target size={20} />
            <span>Next 12 Months</span>
          </div>
        </div>

        <div className="predictions-grid">
          {renderPredictionCard(
            "Average Monthly Income",
            summary.avg_monthly_income,
            <DollarSign size={24} />
          )}
          {renderPredictionCard(
            "Average Monthly Expenses",
            summary.avg_monthly_expenses,
            <TrendingDown size={24} />
          )}
          {renderPredictionCard(
            "Average Monthly Savings",
            summary.avg_monthly_savings,
            <TrendingUp size={24} />
          )}
        </div>

        <div className="confidence-section">
          <h3>Prediction Confidence</h3>
          <div className="confidence-display">
            <div
              className="confidence-bar"
              style={{
                width: `${summary.confidence * 100}%`,
                backgroundColor: getConfidenceColor(summary.confidence),
              }}
            />
            <span className="confidence-text">
              {getConfidenceLabel(summary.confidence)} (
              {Math.round(summary.confidence * 100)}%)
            </span>
          </div>
        </div>

        <div className="monthly-breakdown">
          <h3>Monthly Breakdown</h3>
          <div className="monthly-table">
            <div className="table-header">
              <span data-label="Month">Month</span>
              <span data-label="Income">Income</span>
              <span data-label="Expenses">Expenses</span>
              <span data-label="Savings">Savings</span>
            </div>
            {monthly_predictions.map((month, index) => (
              <div key={index} className="table-row">
                <span className="month-name" data-label="Month">
                  {month.month}
                </span>
                <span className="income-value" data-label="Income">
                  {formatCurrency(month.income)}
                </span>
                <span className="expense-value" data-label="Expenses">
                  {formatCurrency(month.expenses)}
                </span>
                <span
                  className={`savings-value ${
                    month.savings >= 0 ? "positive" : "negative"
                  }`}
                  data-label="Savings"
                >
                  {formatCurrency(month.savings)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {insights && insights.length > 0 && (
          <div className="insights-section">
            <h3>Key Insights</h3>
            <div className="insights-list">
              {insights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.type}`}>
                  {renderInsightIcon(insight.type)}
                  <span>{insight.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderYearlyPredictions = () => {
    if (!yearlyPredictions) return null;

    const { predictions: years } = yearlyPredictions; // array of 2 years

    return (
      <div className="predictions-content">
        <div className="predictions-header">
          <h2>Yearly Predictions</h2>
          <div className="prediction-period">
            <Target size={20} />
            <span>Next 2 Years</span>
          </div>
        </div>

        {years.map((predData, idx) => (
          <div key={idx} className="year-section">
            <h3>{idx === 0 ? "Year 1" : "Year 2"}</h3>
            <div className="predictions-grid">
              {renderPredictionCard(
                "Annual Income",
                predData.income,
                <DollarSign size={24} />
              )}
              {renderPredictionCard(
                "Annual Expenses",
                predData.expenses,
                <TrendingDown size={24} />
              )}
              {renderPredictionCard(
                "Annual Savings",
                predData.savings,
                <TrendingUp size={24} />
              )}
            </div>
            <div className="confidence-section">
              <h3>Prediction Confidence</h3>
              <div className="confidence-display">
                <div
                  className="confidence-bar"
                  style={{
                    width: `${predData.confidence * 100}%`,
                    backgroundColor: getConfidenceColor(predData.confidence),
                  }}
                />
                <span className="confidence-text">
                  {getConfidenceLabel(predData.confidence)} (
                  {Math.round(predData.confidence * 100)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="predictions-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="predictions-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Predictions</h3>
          <p>{error}</p>
          <button
            onClick={() => {
              /* recompute handled by effect */
            }}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="predictions-container">
      <div className="predictions-header-main">
        <h1>Financial Predictions</h1>
        <div className="view-toggle">
          <button
            className={`toggle-button ${
              activeView === "monthly" ? "active" : ""
            }`}
            onClick={() => setActiveView("monthly")}
          >
            Monthly
          </button>
          <button
            className={`toggle-button ${
              activeView === "yearly" ? "active" : ""
            }`}
            onClick={() => setActiveView("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>

      {activeView === "monthly" && renderMonthlyPredictions()}
      {activeView === "yearly" && renderYearlyPredictions()}

      <div className="predictions-footer">
        <div className="disclaimer">
          <Info size={16} />
          <span>
            Predictions are based on historical data and linear regression
            models. Actual results may vary based on market conditions and
            business changes.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
