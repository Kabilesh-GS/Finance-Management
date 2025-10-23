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
        // Predictions now computed locally elsewhere; skip remote fetch
        setPredictions(null);
        setYearlyPredictions(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Market data: gold only (stocks removed per request)
  const [gold, setGold] = useState(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        );
        if (res.ok) {
          const data = await res.json();
          return data.rates?.INR || 83.0;
        }
      } catch (_) {}
      return 83.0;
    };

    const fetchGold = async () => {
      try {
        const res = await fetch("https://www.goldapi.io/api/XAU/USD", {
          headers: { "x-access-token": "goldapi-zwmcsmgyvbwx7-io" },
        });
        if (!res.ok) throw new Error("gold fetch failed");
        const data = await res.json();
        const inr = await fetchExchangeRate();
        const ozInInr = data.price * inr;
        const perGram = ozInInr / 31.1035;
        const per8g = perGram * 8;
        setGold({
          per8g,
          perGram,
          perOunce: ozInInr,
          usdPerOunce: data.price,
          inrRate: inr,
        });
      } catch (_) {
        setGold(null);
      }
    };

    // Stocks removed

    fetchGold();
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
    // Gold queries
    if (query.includes("gold")) {
      if (!gold) return "Gold price data is not available right now.";
      if (
        query.includes("8g") ||
        query.includes("8 g") ||
        query.includes("8 grams") ||
        query.includes("per 8")
      ) {
        return `Gold price per 8g is ₹${gold.per8g.toFixed(2)} (INR).`;
      }
      if (query.includes("gram")) {
        return `Gold price per gram is ₹${gold.perGram.toFixed(2)} (INR).`;
      }
      if (query.includes("ounce")) {
        return `Gold price per ounce is ₹${gold.perOunce.toFixed(
          2
        )} (INR), about $${gold.usdPerOunce.toFixed(2)}.`;
      }
      return `Gold price per 8g: ₹${gold.per8g.toFixed(
        2
      )}, per gram: ₹${gold.perGram.toFixed(2)}.`;
    }

    // Stock queries removed per request

    const insight = monthly?.insights?.[0] || yearly?.insights?.[0];
    if (insight?.message) return insight.message;
    return "Try asking about income, expenses, savings, confidence, gold price (8g/gram/ounce), or stocks (e.g., Reliance).";
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
