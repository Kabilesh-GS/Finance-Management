import { parse } from "papaparse";

const incomeCategories = ["sales", "consulting", "investment"];
const expenseCategories = [
  "payroll",
  "rent",
  "utilities",
  "technology",
  "marketing",
  "travel",
  "professional_services",
  "misc",
];

function normalizeDateToISO(dateStr) {
  // Input like M/D/YYYY → output YYYY-MM-DD
  const [m, d, y] = dateStr.split("/").map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mapExpenseCategory(csvKey) {
  if (csvKey === "rent") return "Office Rent";
  if (csvKey === "professional_services") return "Professional Services";
  return csvKey
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function parseCsvTextToTransactions(csvText) {
  const parsed = parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  const rows = parsed.data || [];

  const transactions = [];

  rows.forEach((row, idx) => {
    if (!row.date) return;
    const isoDate = normalizeDateToISO(String(row.date));
    const baseTime = "00:00";

    // Income
    incomeCategories.forEach((cat) => {
      const rawValue = row[cat];
      const amount =
        typeof rawValue === "number" ? rawValue : parseFloat(rawValue || 0);
      if (amount && amount > 0) {
        transactions.push({
          id: Number(`${Date.parse(isoDate)}${idx}${cat.length}`),
          type: "income",
          category:
            cat === "sales"
              ? "Sales Revenue"
              : cat.charAt(0).toUpperCase() + cat.slice(1),
          amount,
          description: `${cat} income`,
          date: isoDate,
          time: baseTime,
        });
      }
    });

    // Expenses
    expenseCategories.forEach((cat) => {
      const rawValue = row[cat];
      const amount =
        typeof rawValue === "number" ? rawValue : parseFloat(rawValue || 0);
      if (amount && amount > 0) {
        const pretty = mapExpenseCategory(cat);
        transactions.push({
          id: Number(`${Date.parse(isoDate)}${idx}${cat.length + 1}`),
          type: "expense",
          category: pretty,
          amount,
          description: `${pretty} expense`,
          date: isoDate,
          time: baseTime,
        });
      }
    });
  });

  return transactions;
}
