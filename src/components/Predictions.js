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

const Predictions = () => {
  const [predictions, setPredictions] = useState(null);
  const [yearlyPredictions, setYearlyPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("monthly");

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch monthly predictions
      const monthlyResponse = await fetch("http://localhost:8000/predict");
      if (!monthlyResponse.ok) {
        throw new Error("Failed to fetch monthly predictions");
      }
      const monthlyData = await monthlyResponse.json();

      // Fetch yearly predictions
      const yearlyResponse = await fetch("http://localhost:8000/predict/year");
      if (!yearlyResponse.ok) {
        throw new Error("Failed to fetch yearly predictions");
      }
      const yearlyData = await yearlyResponse.json();

      setPredictions(monthlyData);
      setYearlyPredictions(yearlyData);
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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

    const { predictions: predData } = yearlyPredictions;

    return (
      <div className="predictions-content">
        <div className="predictions-header">
          <h2>Yearly Predictions</h2>
          <div className="prediction-period">
            <Target size={20} />
            <span>Next 12 Months</span>
          </div>
        </div>

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
          <button onClick={fetchPredictions} className="retry-button">
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

      {activeView === "monthly"
        ? renderMonthlyPredictions()
        : renderYearlyPredictions()}

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
