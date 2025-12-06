import React, { useEffect, useRef, useState } from "react";
import { Target } from "lucide-react";
import "./Predictions.css";

/**
 * Props:
 * - transactions: array of imported/Firestore transactions
 */
const ChatBot = ({ transactions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef(null);
  const [txSummary, setTxSummary] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [yearlyPredictions, setYearlyPredictions] = useState(null);

  useEffect(() => {
    // compute simple sanitized summary from transactions for AI context & fallback answers
    const summarize = (txs) => {
      if (!Array.isArray(txs) || txs.length === 0) return null;

      let totalIncome = 0;
      let totalExpense = 0;
      const byMonth = {};
      const byCategory = {};

      txs.forEach((t) => {
        const amount = Number(t.amount) || 0;
        const type = (t.type || "").toLowerCase();
        const cat = t.category || "Other";
        const date = t.date || t.createdAt || t.timestamp || t.transactionDate || null;
        let monthKey = "unknown";
        try {
          if (date) monthKey = new Date(date).toISOString().slice(0, 7); // YYYY-MM
        } catch (e) {}
        if (!byMonth[monthKey]) byMonth[monthKey] = { income: 0, expense: 0, count: 0 };
        if (type === "income") {
          totalIncome += amount;
          byMonth[monthKey].income += amount;
        } else {
          totalExpense += amount;
          byMonth[monthKey].expense += amount;
          byCategory[cat] = (byCategory[cat] || 0) + amount;
        }
        byMonth[monthKey].count += 1;
      });

      const months = Object.keys(byMonth)
        .sort()
        .slice(-12)
        .map((m) => ({ month: m, ...byMonth[m] }));

      const topCategories = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));

      return {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        months,
        topCategories,
        txCount: txs.length,
        sampleRecent: txs
          .slice()
          .sort((a, b) => {
            const da = new Date(a.date || a.createdAt || 0).getTime();
            const db = new Date(b.date || b.createdAt || 0).getTime();
            return db - da;
          })
          .slice(0, 6)
          .map((t) => ({
            date: t.date || t.createdAt,
            amount: t.amount,
            type: t.type,
            category: t.category,
          })),
      };
    };

    setTxSummary(summarize(transactions));
  }, [transactions]);

  // Load predictions data from localStorage (same as Predictions component)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("financePredictions");
      const storedYearly = localStorage.getItem("financeYearlyPredictions");
      
      if (stored) {
        setPredictions(JSON.parse(stored));
      }
      if (storedYearly) {
        setYearlyPredictions(JSON.parse(storedYearly));
      }
    } catch (e) {
      console.error("Failed to load predictions from localStorage for chatbot:", e);
    }
  }, [transactions]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chatMessages, isThinking]);

  const formatCurrency = (amount, locale = "en-US", currency = "USD") =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const getConfidenceLabel = (c) => (c >= 0.8 ? "High" : c >= 0.6 ? "Medium" : "Low");

  // Local answer system using transaction data and predictions
  const getAnswer = (q) => {
    const query = (q || "").toLowerCase().trim();
    const monthly = predictions;
    const yearly = yearlyPredictions;
    const s = txSummary;

    // Handle greetings
    if (query === "hi" || query === "hello" || query === "hey" || query === "greetings" || 
        query.startsWith("hi ") || query.startsWith("hello ") || query.startsWith("hey ")) {
      return "Hello! I'm your financial assistant. I can help you understand your transactions, income, expenses, predictions, and more. What would you like to know?";
    }

    // Handle questions about the model
    if (query.includes("model") || query.includes("prediction model") || query.includes("how does it work") || 
        query.includes("what model") || query.includes("algorithm") || query.includes("sarima")) {
      return "I use a SARIMA (Seasonal AutoRegressive Integrated Moving Average) model for financial predictions. The model analyzes your historical transaction data to forecast future income, expenses, and savings. It's optimized using AIC (Akaike Information Criterion) to select the best parameters. The predictions are based on patterns in your past financial data and account for seasonal trends.";
    }

    // Handle questions about monthly data access
    if (query.includes("monthly data") || query.includes("access monthly") || query.includes("where is monthly") || 
        query.includes("how to see monthly") || query.includes("monthly predictions") || query.includes("view monthly")) {
      if (monthly && monthly.monthly_predictions) {
        const monthCount = monthly.monthly_predictions.length;
        return `Monthly predictions are available! I have ${monthCount} months of forecasted data. You can view detailed monthly breakdowns in the Predictions page. Each month includes predicted income, expenses, and savings. Would you like to know about a specific month or see the average monthly values?`;
      } else {
        return "Monthly predictions data is being calculated. Please make sure you have uploaded transaction data in the Transactions page. Once predictions are generated, you can access monthly breakdowns showing income, expenses, and savings for each month.";
      }
    }

    // Handle questions about data availability
    if (query.includes("data available") || query.includes("what data") || query.includes("available data")) {
      const hasTx = s && s.txCount > 0;
      const hasPredictions = monthly && monthly.monthly_predictions;
      const hasYearly = yearly && yearly.predictions;
      
      let response = "Available data: ";
      const parts = [];
      if (hasTx) parts.push(`${s.txCount} transactions`);
      if (hasPredictions) parts.push("monthly predictions");
      if (hasYearly) parts.push("yearly predictions");
      
      if (parts.length > 0) {
        return response + parts.join(", ") + ". What would you like to explore?";
      } else {
        return "No data available yet. Please upload transaction data in the Transactions page to get started with financial insights and predictions.";
      }
    }

    if (s && (query.includes("total") || query.includes("summary") || query.includes("balance"))) {
      return `Imported ${s.txCount} transactions. Total income ${formatCurrency(s.totalIncome)}, total expense ${formatCurrency(
        s.totalExpense
      )}, net ${formatCurrency(s.net)}. Top expense categories: ${
        s.topCategories.map((c) => `${c.category} (${formatCurrency(c.amount)})`).join(", ") || "none"
      }.`;
    }

    if (query.includes("average") && s && s.months.length) {
      const avgIncome = s.months.reduce((a, b) => a + (b.income || 0), 0) / s.months.length;
      const avgExpense = s.months.reduce((a, b) => a + (b.expense || 0), 0) / s.months.length;
      return `Average monthly income ${formatCurrency(avgIncome)}, average monthly expense ${formatCurrency(avgExpense)}.`;
    }

    if (query.includes("income") && monthly?.summary?.avg_monthly_income != null) {
      return `Average monthly income is ${formatCurrency(monthly.summary.avg_monthly_income)}.`;
    }
    if ((query.includes("expense") || query.includes("spend")) && monthly?.summary?.avg_monthly_expenses != null) {
      return `Average monthly expenses are ${formatCurrency(monthly.summary.avg_monthly_expenses)}.`;
    }
    if (query.includes("saving") && monthly?.summary?.avg_monthly_savings != null) {
      return `Average monthly savings are ${formatCurrency(monthly.summary.avg_monthly_savings)}.`;
    }
    if (query.includes("confidence") || query.includes("reliable")) {
      let c = monthly?.summary?.confidence;
      if (c == null && yearly?.predictions) {
        const yearData = Array.isArray(yearly.predictions) ? yearly.predictions[0] : yearly.predictions;
        c = yearData?.confidence;
      }
      if (c != null) return `Prediction confidence is ${Math.round(c * 100)}% (${getConfidenceLabel(c)}).`;
    }
    if (query.includes("year") || query.includes("annual")) {
      const p = yearly?.predictions;
      if (p && Array.isArray(p) && p.length > 0) {
        const yearData = p[0];
        return `Annual income: ${formatCurrency(yearData.income)}, expenses: ${formatCurrency(yearData.expenses)}, savings: ${formatCurrency(yearData.savings)}.`;
      }
    }
    // Handle category-specific questions
    if (query.includes("category") || query.includes("categories")) {
      if (s && s.topCategories && s.topCategories.length > 0) {
        return `Top expense categories: ${s.topCategories.map((c) => `${c.category} (${formatCurrency(c.amount)})`).join(", ")}.`;
      }
      return "No category data available. Please upload CSV transactions first.";
    }

    // Handle recent transactions
    if (query.includes("recent") || query.includes("latest")) {
      if (s && s.sampleRecent && s.sampleRecent.length > 0) {
        const recent = s.sampleRecent.slice(0, 5);
        return `Recent transactions: ${recent.map((t) => `${t.type} - ${t.category} (${formatCurrency(t.amount)}) on ${t.date?.split("T")[0] || "unknown"}`).join("; ")}.`;
      }
      return "No recent transactions found.";
    }

    // Handle monthly breakdown - enhanced
    if (query.includes("month")) {
      // Check for monthly predictions first
      if (monthly && monthly.monthly_predictions && monthly.monthly_predictions.length > 0) {
        // If asking about specific month or latest month
        if (query.includes("latest") || query.includes("last month") || query.includes("recent month")) {
          const latest = monthly.monthly_predictions[monthly.monthly_predictions.length - 1];
          return `Latest predicted month (${latest.month}): Income ${formatCurrency(latest.income)}, Expenses ${formatCurrency(latest.expenses)}, Savings ${formatCurrency(latest.savings)}.`;
        }
        // If asking about all months or monthly breakdown
        if (query.includes("all months") || query.includes("every month") || query.includes("monthly breakdown")) {
          const firstMonth = monthly.monthly_predictions[0];
          const lastMonth = monthly.monthly_predictions[monthly.monthly_predictions.length - 1];
          return `I have predictions for ${monthly.monthly_predictions.length} months, from ${firstMonth.month} to ${lastMonth.month}. You can view the complete monthly breakdown in the Predictions page. Average monthly income: ${formatCurrency(monthly.summary?.avg_monthly_income || 0)}, expenses: ${formatCurrency(monthly.summary?.avg_monthly_expenses || 0)}, savings: ${formatCurrency(monthly.summary?.avg_monthly_savings || 0)}.`;
        }
        // Default: show latest month info
        const latest = monthly.monthly_predictions[monthly.monthly_predictions.length - 1];
        return `Latest predicted month (${latest.month}): Income ${formatCurrency(latest.income)}, Expenses ${formatCurrency(latest.expenses)}, Savings ${formatCurrency(latest.savings)}. I have ${monthly.monthly_predictions.length} months of predictions available.`;
      }
      // Fallback to historical data
      if (s && s.months && s.months.length > 0) {
        const latestMonth = s.months[s.months.length - 1];
        return `Latest historical month (${latestMonth.month}): Income ${formatCurrency(latestMonth.income)}, Expenses ${formatCurrency(latestMonth.expense)}.`;
      }
    }

    // Handle predictions insights
    const insight = monthly?.insights?.[0] || yearly?.insights?.[0];
    if (insight?.message) return insight.message;

    // Handle thanks/gratitude
    if (query.includes("thank") || query.includes("thanks") || query === "ty") {
      return "You're welcome! Feel free to ask me anything else about your financial data.";
    }

    // Handle goodbye
    if (query.includes("bye") || query.includes("goodbye") || query.includes("see you")) {
      return "Goodbye! Feel free to come back anytime if you have questions about your finances.";
    }

    // Default responses
    if (query.includes("help") || query.includes("what can") || query.includes("capabilities") || query.includes("what do you")) {
      return "I can help you with:\n• Transaction summaries and totals\n• Income and expense analysis\n• Monthly and yearly predictions\n• Category breakdowns\n• Recent transactions\n• Prediction model information\n• Data availability\n\nTry asking: 'What's my total income?', 'Show monthly predictions', 'What model do you use?', or 'What data is available?'";
    }

    if (!s || !s.txCount) {
      return "No transaction data available. Please upload a CSV file in the Transactions page first to get financial insights. Once you have data, I can help you with summaries, predictions, and analysis!";
    }

    return "I can help answer questions about your transactions, predictions, income, expenses, and categories. Try asking about totals, averages, monthly data, or say 'help' to see what I can do!";
  };

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsThinking(true);

    // Simulate thinking delay for better UX
    setTimeout(() => {
      const answer = getAnswer(text);
      setChatMessages((prev) => [...prev, { role: "bot", text: answer || "I can help you with questions about your financial data. Try asking about totals, averages, predictions, or categories." }]);
      setIsThinking(false);
    }, 300);
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
            <span>Ask about your transactions, income, expenses, savings, predictions, and categories</span>
          </div>
        </div>

        <div className="chat-window">
          <div className="chat-messages" ref={messagesRef}>
            {chatMessages.length === 0 && (
              <div className="chat-empty">Try: "Show me a summary of my imported CSV" or "What are top expense categories?"</div>
            )}
            {chatMessages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.role === "user" ? "user" : "bot"}`}>
                <span>{m.text}</span>
              </div>
            ))}
            {isThinking && (
              <div className="chat-message bot">
                <span>Thinking...</span>
              </div>
            )}
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
            <button 
              className="chat-send" 
              onClick={handleSend} 
              disabled={isThinking}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
