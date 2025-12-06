const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const FRONTEND_ORIGIN = "http://localhost:3000";
app.use(cors({ origin: FRONTEND_ORIGIN }));

const GOOGLE_API_KEY = process.env.REACT_APP_API_KEY;
if (!REACT_APP_API_KEY) {
  console.error("Set GOOGLE_API_KEY in environment");
  process.exit(1);
}

// support Node <18 by dynamically importing node-fetch if global fetch missing
const fetchFn =
  globalThis.fetch ||
  ((...args) => import("node-fetch").then((m) => m.default(...args)));

const MODEL = "gemini-2.5-flash";

app.post("/api/chat", async (req, res) => {
  try {
    const { question, context, history } = req.body;
    const systemPrompt =
      "You are a concise, helpful financial assistant. Use provided context (gold prices and summaries) when answering. Keep answers short and actionable.";

    const historyText = Array.isArray(history)
      ? history
          .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
          .join("\n")
      : "";
    const contextText = context ? `Context: ${JSON.stringify(context)}` : "";

    const promptText = [
      systemPrompt,
      historyText,
      contextText,
      `User: ${question}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/${MODEL}:generateText?key=${REACT_APP_API_KEY}`;
    const body = {
      prompt: { text: promptText },
      temperature: 0.2,
      maxOutputTokens: 500,
    };

    const r = await fetchFn(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("Gemini API error:", r.status, text);
      return res.status(502).json({ error: "Gemini API error", detail: text });
    }

    const json = await r.json();
    const reply =
      (json?.candidates && json.candidates[0]?.output) || json?.output || "";
    const cleanReply =
      typeof reply === "string" ? reply.trim() : JSON.stringify(reply);

    res.json({ reply: cleanReply });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    res.status(500).json({ error: "AI proxy error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () =>
  console.log(
    `Gemini proxy listening on ${port}, CORS origin: ${FRONTEND_ORIGIN}`
  )
);
