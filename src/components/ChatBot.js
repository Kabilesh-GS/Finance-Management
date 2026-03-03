import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Predictions.css";

const ChatBot = ({ transactions = [] }) => {
  const MAX_TRANSACTIONS_FOR_RAG = 5000;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [yearlyPredictions, setYearlyPredictions] = useState(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("financePredictions");
      const storedYearly = localStorage.getItem("financeYearlyPredictions");
      if (stored) setPredictions(JSON.parse(stored));
      if (storedYearly) setYearlyPredictions(JSON.parse(storedYearly));
    } catch (e) {
      setPredictions(null);
      setYearlyPredictions(null);
    }
  }, [transactions]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const contextStats = useMemo(() => {
    const txCount = Array.isArray(transactions) ? transactions.length : 0;
    const monthlyCount = Array.isArray(predictions?.monthly_predictions)
      ? predictions.monthly_predictions.length
      : 0;
    const yearlyCount = Array.isArray(yearlyPredictions?.predictions)
      ? yearlyPredictions.predictions.length
      : yearlyPredictions?.predictions
        ? 1
        : 0;

    return { txCount, monthlyCount, yearlyCount };
  }, [transactions, predictions, yearlyPredictions]);

  const askRag = async (question) => {
    const ragBase =
      process.env.REACT_APP_CHAT_API_BASE || "http://localhost:3001";

    const compactTransactions = (
      Array.isArray(transactions) ? transactions : []
    )
      .slice(0, MAX_TRANSACTIONS_FOR_RAG)
      .map((tx) => ({
        amount: Number(tx?.amount) || 0,
        type: tx?.type || "expense",
        category: tx?.category || "Other",
        date: tx?.date || tx?.createdAt || tx?.timestamp || null,
      }));

    const response = await fetch(`${ragBase}/api/chat/rag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        transactions: compactTransactions,
        predictions,
        yearlyPredictions,
        history: messages.slice(-8),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 413) {
        throw new Error("Payload too large. Please reduce transaction size.");
      }
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    return response.json();
  };

  const onSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const result = await askRag(question);
      const citations = Array.isArray(result?.citations)
        ? result.citations
        : [];
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            result?.answer ||
            "I couldn't generate a response from your data. Please try another question.",
          citations,
        },
      ]);
    } catch (e) {
      setError(
        "Could not reach RAG backend. Start the backend on port 3001 and try again.",
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "RAG backend is unavailable right now. Please retry after starting the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predictions-container">
      <div className="predictions-content">
        <div className="predictions-header">
          <h2>Chat Bot</h2>
        </div>

        <div className="disclaimer chat-context-summary">
          Context loaded: {contextStats.txCount} transactions,{" "}
          {contextStats.monthlyCount} monthly predictions,{" "}
          {contextStats.yearlyCount} yearly predictions.
        </div>

        <div className="chat-window">
          <div className="chat-messages" ref={messagesRef}>
            {messages.length === 0 && (
              <div className="chat-empty">
                Ask questions like "What are my total expenses?", "Show monthly
                trend", "What is an emergency fund?", or "How does compound
                interest work?"
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message ${message.role === "user" ? "user" : "bot"}`}
              >
                <span>{message.text}</span>
                {message.role === "bot" &&
                  Array.isArray(message.citations) &&
                  message.citations.length > 0 && (
                    <div className="chat-citations-wrap">
                      {message.citations.slice(0, 2).map((c) => (
                        <div key={c.id} className="chat-citation-item">
                          Source: {c.title}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {loading && (
              <div className="chat-message bot">
                <span>Retrieving relevant data and generating answer...</span>
              </div>
            )}
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about your financial data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
            />
            <button
              className="chat-send"
              onClick={onSend}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>

        {error && (
          <div className="error-state chat-error-state">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
