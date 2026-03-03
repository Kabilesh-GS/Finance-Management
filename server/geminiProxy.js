const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const splitIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, splitIndex).trim();
    let value = trimmed.slice(splitIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || LOCALHOST_ORIGIN.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked origin"));
    },
  }),
);

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "with",
  "me",
  "my",
  "show",
  "tell",
  "about",
  "what",
  "how",
  "do",
  "does",
  "can",
  "could",
  "should",
]);

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.REACT_APP_GEMINI_API ||
  process.env.REACT_APP_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const BASIC_FINANCE_TOPICS = [
  {
    id: "financing",
    title: "Financing Basics",
    keywords: ["financing", "finance", "borrow", "capital", "funding"],
    answer:
      "Financing means obtaining money to pay for a purchase, business, or project now and repaying it over time (or from future cash flows). Common forms include loans, credit lines, bonds, and equity funding.",
  },
  {
    id: "budgeting",
    title: "Budgeting (50/30/20)",
    keywords: ["budget", "budgeting", "50 30 20", "rule"],
    answer:
      "A simple budgeting method is 50/30/20: about 50% for needs, 30% for wants, and 20% for savings/debt repayment. If your essentials are high, start with any split you can sustain and increase savings gradually.",
  },
  {
    id: "emergency-fund",
    title: "Emergency Fund",
    keywords: ["emergency", "fund", "rainy day"],
    answer:
      "A practical emergency fund target is 3-6 months of essential expenses. Keep it in a safe, liquid account and build it in stages (for example: first 1 month, then 3 months, then 6 months).",
  },
  {
    id: "compound-interest",
    title: "Compound Interest",
    keywords: ["compound", "interest", "compounding"],
    answer:
      "Compound interest means you earn returns on both your original money and past returns. Starting early matters because compounding grows non-linearly over time.",
  },
  {
    id: "inflation",
    title: "Inflation",
    keywords: ["inflation", "price rise", "purchasing power"],
    answer:
      "Inflation reduces purchasing power over time. To protect long-term goals, your investments usually need returns that outpace inflation after taxes and fees.",
  },
  {
    id: "credit-score",
    title: "Credit Score Basics",
    keywords: ["credit score", "credit", "cibil", "fico"],
    answer:
      "Credit scores improve with on-time payments, low credit utilization, longer credit history, and fewer hard inquiries. Paying bills on time is the highest-impact habit.",
  },
  {
    id: "debt-payoff",
    title: "Debt Payoff Strategies",
    keywords: ["debt", "loan", "snowball", "avalanche", "repay"],
    answer:
      "Two common debt payoff methods: Snowball (smallest balance first for motivation) and Avalanche (highest interest first to minimize total interest). Use the one you can stick to.",
  },
  {
    id: "diversification",
    title: "Diversification",
    keywords: ["diversification", "diversify", "asset allocation", "portfolio"],
    answer:
      "Diversification spreads risk across assets (for example equity, debt, cash). Asset allocation should match your time horizon and risk tolerance, then be rebalanced periodically.",
  },
  {
    id: "sip-dca",
    title: "SIP / Dollar-Cost Averaging",
    keywords: ["sip", "dca", "dollar cost averaging", "systematic"],
    answer:
      "SIP (systematic investing) or dollar-cost averaging invests a fixed amount regularly, reducing timing risk and helping build investing discipline.",
  },
  {
    id: "retirement",
    title: "Retirement Planning",
    keywords: ["retirement", "pension", "retire"],
    answer:
      "Estimate retirement corpus using expected annual expenses, inflation, and years in retirement. Start early and increase contributions as income rises.",
  },
  {
    id: "term-insurance",
    title: "Insurance Basics",
    keywords: ["insurance", "term plan", "health insurance", "cover"],
    answer:
      "Insurance protects against major financial shocks. Prioritize health insurance and pure term life insurance (if dependents rely on your income) before aggressive investing.",
  },
];

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) =>
  normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const safeMonth = (dateLike) => {
  if (!dateLike) return "unknown";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toISOString().slice(0, 7);
};

function summarizeTransactions(transactions = []) {
  const valid = Array.isArray(transactions) ? transactions : [];
  const monthMap = {};
  const categoryMap = {};
  let income = 0;
  let expenses = 0;

  for (const tx of valid) {
    const amount = toNumber(tx?.amount);
    const type = String(tx?.type || "expense").toLowerCase();
    const category = String(tx?.category || "Other");
    const month = safeMonth(tx?.date || tx?.createdAt || tx?.timestamp);

    if (!monthMap[month])
      monthMap[month] = { income: 0, expenses: 0, count: 0 };
    monthMap[month].count += 1;

    if (type === "income") {
      income += amount;
      monthMap[month].income += amount;
    } else {
      expenses += amount;
      monthMap[month].expenses += amount;
      categoryMap[category] = (categoryMap[category] || 0) + amount;
    }
  }

  const monthly = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-18)
    .map(([month, data]) => ({
      month,
      ...data,
      savings: data.income - data.expenses,
    }));

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount }));

  return {
    count: valid.length,
    income,
    expenses,
    savings: income - expenses,
    monthly,
    topCategories,
  };
}

function buildKnowledgeChunks(payload = {}) {
  const transactions = Array.isArray(payload.transactions)
    ? payload.transactions
    : [];
  const predictions = payload.predictions || null;
  const yearlyPredictions = payload.yearlyPredictions || null;
  const summary = summarizeTransactions(transactions);
  const chunks = [];

  chunks.push({
    id: "summary",
    title: "Overall Financial Summary",
    text: `Transactions: ${summary.count}. Total income: ${formatMoney(summary.income)}. Total expenses: ${formatMoney(summary.expenses)}. Net savings: ${formatMoney(summary.savings)}.`,
    tags: ["summary", "income", "expenses", "savings", "totals", "balance"],
    meta: { type: "summary" },
  });

  for (const item of summary.monthly) {
    chunks.push({
      id: `month-${item.month}`,
      title: `Monthly Snapshot ${item.month}`,
      text: `${item.month}: income ${formatMoney(item.income)}, expenses ${formatMoney(item.expenses)}, savings ${formatMoney(item.savings)}, transactions ${item.count}.`,
      tags: ["month", "monthly", item.month, "income", "expenses", "savings"],
      meta: { type: "monthly", month: item.month },
    });
  }

  for (const cat of summary.topCategories) {
    chunks.push({
      id: `cat-${normalizeText(cat.category).replace(/\s+/g, "-")}`,
      title: `Category Spend ${cat.category}`,
      text: `Expense category ${cat.category} total spend ${formatMoney(cat.amount)}.`,
      tags: ["category", "expense", normalizeText(cat.category)],
      meta: { type: "category", category: cat.category },
    });
  }

  const monthlyPred = Array.isArray(predictions?.monthly_predictions)
    ? predictions.monthly_predictions
    : [];
  if (monthlyPred.length > 0) {
    const avgIncome = toNumber(predictions?.summary?.avg_monthly_income);
    const avgExpenses = toNumber(predictions?.summary?.avg_monthly_expenses);
    const avgSavings = toNumber(predictions?.summary?.avg_monthly_savings);
    const confidence = toNumber(predictions?.summary?.confidence) * 100;

    chunks.push({
      id: "prediction-summary",
      title: "Prediction Summary",
      text: `Predicted average monthly income ${formatMoney(avgIncome)}, expenses ${formatMoney(avgExpenses)}, savings ${formatMoney(avgSavings)}, confidence ${Math.round(confidence)}%.`,
      tags: ["prediction", "forecast", "monthly", "confidence", "future"],
      meta: { type: "prediction-summary" },
    });

    for (const forecast of monthlyPred.slice(0, 12)) {
      chunks.push({
        id: `forecast-${forecast.month}`,
        title: `Forecast ${forecast.month}`,
        text: `Forecast for ${forecast.month}: income ${formatMoney(forecast.income)}, expenses ${formatMoney(forecast.expenses)}, savings ${formatMoney(forecast.savings)}.`,
        tags: ["forecast", "prediction", "month", String(forecast.month || "")],
        meta: { type: "forecast", month: forecast.month },
      });
    }
  }

  const yearly = Array.isArray(yearlyPredictions?.predictions)
    ? yearlyPredictions.predictions
    : yearlyPredictions?.predictions
      ? [yearlyPredictions.predictions]
      : [];
  yearly.forEach((yearData, index) => {
    chunks.push({
      id: `year-${index + 1}`,
      title: `Yearly Forecast ${index + 1}`,
      text: `Year ${index + 1} forecast income ${formatMoney(yearData?.income)}, expenses ${formatMoney(yearData?.expenses)}, savings ${formatMoney(yearData?.savings)}, confidence ${Math.round(toNumber(yearData?.confidence) * 100)}%.`,
      tags: ["year", "annual", "prediction", "forecast", `year${index + 1}`],
      meta: { type: "yearly", index: index + 1 },
    });
  });

  for (const topic of BASIC_FINANCE_TOPICS) {
    chunks.push({
      id: `finance-${topic.id}`,
      title: `Finance Basics: ${topic.title}`,
      text: topic.answer,
      tags: [
        "finance",
        "basics",
        ...topic.keywords.map((k) => normalizeText(k)),
      ],
      meta: { type: "finance-basics", topic: topic.id },
    });
  }

  return chunks;
}

function retrieveRelevantChunks(question, chunks) {
  const qTokens = tokenize(question);
  const qSet = new Set(qTokens);

  const scored = chunks
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.text} ${(chunk.tags || []).join(" ")}`;
      const cTokens = tokenize(haystack);
      const cSet = new Set(cTokens);

      let overlap = 0;
      qSet.forEach((token) => {
        if (cSet.has(token)) overlap += 1;
      });

      const phraseBonus = normalizeText(chunk.text).includes(
        normalizeText(question),
      )
        ? 2
        : 0;
      const density = overlap / Math.max(cSet.size, 1);
      const score = overlap + density * 2 + phraseBonus;

      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 5);
  if (top.length > 0) return top;
  return chunks.slice(0, 3).map((chunk) => ({ ...chunk, score: 0 }));
}

function mergeRetrieved(primary, secondary, maxCount = 6) {
  const merged = [];
  const seen = new Set();

  for (const item of [...primary, ...secondary]) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= maxCount) break;
  }

  return merged;
}

function isGeneralFinanceQuestion(question) {
  const q = normalizeText(question);
  const hints = [
    "finance",
    "financing",
    "budget",
    "invest",
    "inflation",
    "interest",
    "loan",
    "debt",
    "credit",
    "retirement",
    "insurance",
    "sip",
    "portfolio",
    "tax",
  ];
  return hints.some((hint) => q.includes(hint));
}

function buildGroundedAnswer(question, retrieved, summary) {
  const normalized = normalizeText(question);

  if (summary.count === 0) {
    return "No transaction data is available yet. Upload or add transactions first, then I can answer with grounded financial insights.";
  }

  if (
    normalized.includes("total") ||
    normalized.includes("summary") ||
    normalized.includes("balance")
  ) {
    return `You currently have ${summary.count} transactions. Total income is ${formatMoney(summary.income)}, total expenses are ${formatMoney(summary.expenses)}, and net savings are ${formatMoney(summary.savings)}.`;
  }

  if (normalized.includes("top") && normalized.includes("categor")) {
    if (summary.topCategories.length === 0) {
      return "No expense categories are available yet.";
    }
    const top = summary.topCategories
      .slice(0, 5)
      .map((c) => `${c.category} (${formatMoney(c.amount)})`)
      .join(", ");
    return `Top expense categories are: ${top}.`;
  }

  if (normalized.includes("month") || normalized.includes("monthly")) {
    const months = summary.monthly.slice(-3);
    if (months.length === 0) {
      return "No monthly breakdown is available yet.";
    }
    const text = months
      .map(
        (m) =>
          `${m.month}: income ${formatMoney(m.income)}, expenses ${formatMoney(m.expenses)}, savings ${formatMoney(m.savings)}`,
      )
      .join("; ");
    return `Recent monthly performance: ${text}.`;
  }

  const snippets = retrieved
    .slice(0, 3)
    .map((chunk) => `${chunk.title}: ${chunk.text}`)
    .join("\n");

  return `Based on your app data, here is the most relevant context:\n${snippets}\n\nIf you want a sharper answer, ask about totals, monthly trends, categories, or yearly predictions.`;
}

const fetchFn =
  globalThis.fetch ||
  ((...args) => import("node-fetch").then((module) => module.default(...args)));

function parseGeminiText(json) {
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("\n")
      .trim() || "";

  if (text) return text;

  const blockedReason = json?.promptFeedback?.blockReason;
  if (blockedReason) {
    return `I could not answer this request because the model blocked it (${blockedReason}). Please rephrase your question.`;
  }

  return "I could not generate a response right now. Please try again.";
}

async function generateAnswerWithGemini({
  question,
  retrieved,
  summary,
  history,
}) {
  if (
    !GEMINI_API_KEY ||
    GEMINI_API_KEY.includes("your_google_gemini_api_key")
  ) {
    throw new Error("Gemini API key is not configured.");
  }

  const contextBlock = retrieved
    .slice(0, 6)
    .map((chunk, index) => `[${index + 1}] ${chunk.title}\n${chunk.text}`)
    .join("\n\n");

  const historyBlock = Array.isArray(history)
    ? history
        .slice(-8)
        .map(
          (item) =>
            `${item?.role === "user" ? "User" : "Assistant"}: ${String(item?.text || "")}`,
        )
        .join("\n")
    : "";

  const prompt = [
    "You are a concise financial assistant using Retrieval-Augmented Generation (RAG).",
    "For app-specific numbers and facts, rely on retrieved context and never invent values.",
    "For general finance education questions, you may answer using your finance knowledge and retrieved finance-basics context.",
    "If app data is missing for a data-specific question, clearly say so and suggest the next best question/action.",
    "Keep the answer short, practical, and easy to read.",
    "",
    `User Question: ${question}`,
    "",
    "Retrieved Context:",
    contextBlock || "No retrieved context available.",
    "",
    "Conversation History:",
    historyBlock || "No prior history.",
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 500,
    },
  };

  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${detail}`);
  }

  const json = await response.json();
  return parseGeminiText(json);
}

app.post("/api/chat/rag", async (req, res) => {
  try {
    const { question, transactions, predictions, yearlyPredictions, history } =
      req.body || {};
    const userQuestion = String(question || "").trim();

    if (!userQuestion) {
      return res.status(400).json({ error: "Question is required." });
    }

    const chunks = buildKnowledgeChunks({
      transactions,
      predictions,
      yearlyPredictions,
    });
    const retrieved = retrieveRelevantChunks(userQuestion, chunks);
    const financeChunks = chunks.filter(
      (chunk) => chunk?.meta?.type === "finance-basics",
    );
    const financeRetrieved = retrieveRelevantChunks(
      userQuestion,
      financeChunks,
    );
    const enrichedRetrieved =
      isGeneralFinanceQuestion(userQuestion) ||
      !retrieved.some((chunk) => chunk?.meta?.type === "finance-basics")
        ? mergeRetrieved(retrieved, financeRetrieved, 6)
        : retrieved;
    const summary = summarizeTransactions(transactions || []);
    let answer;
    let responseType = "gemini-rag";

    try {
      answer = await generateAnswerWithGemini({
        question: userQuestion,
        retrieved: enrichedRetrieved,
        summary,
        history,
      });
    } catch (geminiError) {
      console.error(
        "Gemini generation failed, using local fallback:",
        geminiError,
      );
      answer = buildGroundedAnswer(userQuestion, enrichedRetrieved, summary);
      responseType = "local-fallback";
    }

    const citations = enrichedRetrieved.map((item) => ({
      id: item.id,
      title: item.title,
      text: item.text,
      score: Number(item.score.toFixed(3)),
    }));

    return res.json({
      answer,
      citations,
      meta: {
        chunkCount: chunks.length,
        retrievedCount: citations.length,
        responseType,
        model: GEMINI_MODEL,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate RAG response.",
      detail: String(error?.message || error),
    });
  }
});

app.use((err, _req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request payload too large",
      detail:
        "Reduce the transaction payload size or increase backend body limit.",
    });
  }
  return next(err);
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "RAG chat backend running" });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Chat backend starter running on ${port}`);
});
