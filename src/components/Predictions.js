import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
// Predictions are now sourced from backend API

const Predictions = ({ transactions, budgets }) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/predict");
        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }
        const data = await res.json();

        const income =
          (data.predictions && data.predictions.income) ?? data.income ?? 0;
        const expenses =
          (data.predictions && data.predictions.expenses) ?? data.expenses ?? 0;
        const savings =
          (data.predictions && data.predictions.savings) ??
          data.savings ??
          income - expenses;
        const confidence =
          (data.predictions && data.predictions.confidence) ??
          data.confidence ??
          0.7;
        const month = data.month || data.next_month || "Next Month";
        const insights = data.insights || [];

        setPredictions({
          month,
          predictions: { income, expenses, savings },
          confidence,
          insights,
        });
      } catch (err) {
        console.error("Failed to fetch predictions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  console.log(predictions);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial Predictions
          </h1>
          <p className="text-gray-600">
            Analyzing historical data to predict next month's finances
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial Predictions
          </h1>
          <p className="text-gray-600">Insufficient data for predictions</p>
        </div>
        <div className="text-center py-8">
          <Info size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Predictions Available
          </h3>
          <p className="text-gray-600">
            Add more transaction data to enable predictions
          </p>
        </div>
      </div>
    );
  }

  const { month, predictions: pred, confidence, insights } = predictions;

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card hover-scale">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Confidence</div>
          <div className="text-sm font-medium">
            {Math.round(confidence * 100)}%
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        ₹{value.toLocaleString()}
      </h3>
      <p className="text-gray-600">{title}</p>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-2 text-sm ${
            trend > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(trend).toFixed(1)}% vs avg</span>
        </div>
      )}
    </div>
  );

  const InsightCard = ({ insight, index }) => (
    <div
      key={index}
      className={`p-4 border rounded-lg ${
        insight.type === "positive"
          ? "bg-green-50 border-green-200"
          : insight.type === "warning"
          ? "bg-yellow-50 border-yellow-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {insight.type === "positive" ? (
          <CheckCircle size={20} className="text-green-600 mt-0.5" />
        ) : insight.type === "warning" ? (
          <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
        ) : (
          <AlertTriangle size={20} className="text-red-600 mt-0.5" />
        )}
        <p
          className={`text-sm ${
            insight.type === "positive"
              ? "text-green-800"
              : insight.type === "warning"
              ? "text-yellow-800"
              : "text-red-800"
          }`}
        >
          {insight.message}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Financial Predictions
        </h1>
        <p className="text-gray-600">AI-powered predictions for {month}</p>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-3 mb-8">
        <StatCard
          title="Predicted Income"
          value={pred.income}
          icon={TrendingUp}
          color="bg-green-500"
          trend={pred.income > 0 ? 5.2 : 0}
        />
        <StatCard
          title="Predicted Expenses"
          value={pred.expenses}
          icon={TrendingDown}
          color="bg-red-500"
          trend={pred.expenses > 0 ? -2.1 : 0}
        />
        <StatCard
          title="Predicted Savings"
          value={pred.savings}
          icon={DollarSign}
          color={pred.savings >= 0 ? "bg-blue-500" : "bg-red-500"}
          trend={pred.savings > 0 ? 8.3 : -5.1}
        />
      </div>

      {/* Prediction Details */}
      <div className="grid grid-2 gap-6 mt-4">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Prediction Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Expected Income</span>
              <span className="font-semibold text-green-600">
                ₹{pred.income.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Expected Expenses</span>
              <span className="font-semibold text-red-600">
                ₹{pred.expenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Expected Savings</span>
              <span
                className={`font-semibold ${
                  pred.savings >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                ₹{pred.savings.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Savings Rate</span>
              <span className="font-semibold text-gray-900">
                {pred.income > 0
                  ? ((pred.savings / pred.income) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Model Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Prediction Confidence</span>
              <span className="font-semibold">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Points Used</span>
              <span className="font-semibold">
                {transactions.length} transactions
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time Period</span>
              <span className="font-semibold">2 years historical</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Algorithm</span>
              <span className="font-semibold">Regression Model</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="card mt-4">
          <h3 className="text-lg font-semibold mb-4">Prediction Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
