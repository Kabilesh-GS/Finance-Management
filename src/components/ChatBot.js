import React, { useEffect, useState } from "react";
import { Target } from "lucide-react";
import "./Predictions.css";

const ChatBot = () => {
  const [predictions, setPredictions] = useState(null);
  const [yearlyPredictions, setYearlyPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const m = await fetch("http://localhost:8000/predict");
        const y = await fetch("http://localhost:8000/predict/year");
        if (!m.ok || !y.ok) throw new Error("Failed to fetch predictions");
        setPredictions(await m.json());
        setYearlyPredictions(await y.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const getConfidenceLabel = (c) =>
    c >= 0.8 ? "High" : c >= 0.6 ? "Medium" : "Low";

  const answerQuery = (q) => {
    const query = (q || "").toLowerCase();
    const monthly = predictions;
    const yearly = yearlyPredictions;
    if (!monthly && !yearly)
      return "Predictions are still loading. Please try again shortly.";

    if (
      query.includes("income") &&
      monthly?.summary?.avg_monthly_income != null
    ) {
      return `Average monthly income is ${formatCurrency(
        monthly.summary.avg_monthly_income
      )}.`;
    }
    if (
      (query.includes("expense") || query.includes("spend")) &&
      monthly?.summary?.avg_monthly_expenses != null
    ) {
      return `Average monthly expenses are ${formatCurrency(
        monthly.summary.avg_monthly_expenses
      )}.`;
    }
    if (
      query.includes("saving") &&
      monthly?.summary?.avg_monthly_savings != null
    ) {
      return `Average monthly savings are ${formatCurrency(
        monthly.summary.avg_monthly_savings
      )}.`;
    }
    if (query.includes("confidence") || query.includes("reliable")) {
      const c = monthly?.summary?.confidence ?? yearly?.predictions?.confidence;
      if (c != null)
        return `Prediction confidence is ${Math.round(
          c * 100
        )}% (${getConfidenceLabel(c)}).`;
    }
    if (query.includes("year") || query.includes("annual")) {
      const p = yearly?.predictions;
      if (p)
        return `Annual income: ${formatCurrency(
          p.income
        )}, expenses: ${formatCurrency(p.expenses)}, savings: ${formatCurrency(
          p.savings
        )}.`;
    }
    const insight = monthly?.insights?.[0] || yearly?.insights?.[0];
    if (insight?.message) return insight.message;
    return "Try asking about income, expenses, savings, confidence, or annual totals.";
  };

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { role: "user", text };
    const botMsg = { role: "bot", text: answerQuery(text) };
    setChatMessages((prev) => [...prev, userMsg, botMsg]);
    setChatInput("");
  };

  if (loading) return <div className="predictions-container">Loading...</div>;
  if (error) return <div className="predictions-container">Error: {error}</div>;

  return (
    <div className="predictions-container">
      <div className="predictions-content">
        <div className="predictions-header">
          <h2>Chat Bot</h2>
          <div className="prediction-period">
            <Target size={20} />
            <span>Ask about income, expenses, savings, confidence</span>
          </div>
        </div>
        <div className="chat-window">
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-empty">
                Try: "What is the average monthly income?"
              </div>
            )}
            {chatMessages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.role}`}>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Type your question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button className="chat-send" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
