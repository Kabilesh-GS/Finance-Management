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
import { transactionsToCsv } from "../utils/transactionsToCsv";

const Predictions = ({ transactions = [] }) => {
  const [predictions, setPredictions] = useState(null);
  const [yearlyPredictions, setYearlyPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("monthly");

  // Generate a simple hash/identifier from transactions to detect changes
  const getTransactionsHash = (txs) => {
    if (!txs || txs.length === 0) return "";
    // Create a simple hash based on transaction count and IDs
    const ids = txs
      .map((t) => t.id || "")
      .sort()
      .join(",");
    const count = txs.length;
    return `${count}-${ids.substring(0, 100)}`; // Use first 100 chars of IDs
  };

  // Load predictions from localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("financePredictions");
      const storedYearly = localStorage.getItem("financeYearlyPredictions");
      const storedHash = localStorage.getItem("financePredictionsHash");

      if (stored && storedYearly && storedHash) {
        const currentHash = getTransactionsHash(transactions);
        // Only use stored data if transactions haven't changed
        if (storedHash === currentHash && transactions.length > 0) {
          return {
            predictions: JSON.parse(stored),
            yearlyPredictions: JSON.parse(storedYearly),
          };
        }
      }
    } catch (e) {
      console.error("Failed to load predictions from localStorage:", e);
    }
    return null;
  };

  // Save predictions to localStorage
  const saveToLocalStorage = (monthlyData, yearlyData) => {
    try {
      const hash = getTransactionsHash(transactions);
      localStorage.setItem("financePredictions", JSON.stringify(monthlyData));
      localStorage.setItem(
        "financeYearlyPredictions",
        JSON.stringify(yearlyData)
      );
      localStorage.setItem("financePredictionsHash", hash);
    } catch (e) {
      console.error("Failed to save predictions to localStorage:", e);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // First, try to load from localStorage
    const cached = loadFromLocalStorage();
    if (cached) {
      setPredictions(cached.predictions);
      setYearlyPredictions(cached.yearlyPredictions);
      setLoading(false);
      return;
    }

    async function loadPredictions() {
      try {
        setLoading(true);
        setError(null);

        const apiBase = process.env.REACT_APP_PY_API_BASE
          ? process.env.REACT_APP_PY_API_BASE
          : "http://localhost:8000";
        const hasTransactions = transactions && transactions.length > 0;
        const csvData = hasTransactions
          ? transactionsToCsv(transactions)
          : null;

        // CSV data is required - if no transactions uploaded, show helpful error
        if (!csvData || !csvData.trim()) {
          throw new Error(
            "No CSV data available. Please upload a CSV file in the Transactions page first."
          );
        }

        // Send CSV via POST to Python backend
        const monthlyUrl = `${apiBase}/predict`;
        const monthlyOptions = {
          method: "POST",
          headers: { "Content-Type": "text/csv" },
          body: csvData,
        };

        const resp = await fetch(monthlyUrl, monthlyOptions);

        if (!resp.ok) {
          throw new Error(`Failed to load predictions: ${resp.statusText}`);
        }

        const data = await resp.json();
        if (!cancelled) {
          setPredictions(data);

          // Fetch yearly predictions from Python backend
          let yearlyData = null;
          try {
            const yearlyUrl = `${apiBase}/predict/year`;
            const yearlyOptions = {
              method: "POST",
              headers: { "Content-Type": "text/csv" },
              body: csvData,
            };

            const yResp = await fetch(yearlyUrl, yearlyOptions);

            if (yResp.ok) {
              const yData = await yResp.json();
              // Convert Python format to frontend format (array of years)
              if (yData.predictions && !Array.isArray(yData.predictions)) {
                // Python returns single year, convert to array format for 2-year view
                yearlyData = {
                  predictions: [
                    yData.predictions,
                    yData.predictions, // Use same data for year 2 (can be enhanced later)
                  ],
                  insights: yData.insights || [],
                };
              } else {
                yearlyData = yData;
              }
              setYearlyPredictions(yearlyData);
            } else {
              // If yearly endpoint fails, create simple summary from monthly predictions
              if (data.monthly_predictions) {
                const year1 = data.monthly_predictions.slice(0, 12).reduce(
                  (acc, month) => ({
                    income: acc.income + (month.income || 0),
                    expenses: acc.expenses + (month.expenses || 0),
                    savings: 0,
                  }),
                  { income: 0, expenses: 0, savings: 0 }
                );
                year1.savings = year1.income - year1.expenses;
                year1.confidence = data.summary?.confidence || 0.7;

                yearlyData = {
                  predictions: [year1, year1],
                };
                setYearlyPredictions(yearlyData);
              }
            }
          } catch (yErr) {
            console.error("Error loading yearly predictions:", yErr);
            // Continue with monthly predictions only
          }

          // Save to localStorage after successful fetch
          if (data) {
            // Use yearlyData if available, otherwise create empty structure
            const finalYearlyData = yearlyData || {
              predictions: [],
              insights: [],
            };
            saveToLocalStorage(data, finalYearlyData);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e.message ||
              "Failed to load predictions from Python backend. Please ensure the backend server is running."
          );
          setPredictions(null);
          setYearlyPredictions(null);
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
              setError(null);
              setLoading(true);
              window.location.reload();
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
