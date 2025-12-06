/**
 * Convert transactions array to CSV format compatible with Python backend
 * The CSV should have columns: date, sales, consulting, investment, payroll, rent, utilities, technology, marketing, travel, professional_services, misc
 */

const categoryMapping = {
  // Income categories
  "Sales Revenue": "sales",
  "Consulting": "consulting",
  "Investment": "investment",
  
  // Expense categories
  "Payroll": "payroll",
  "Office Rent": "rent",
  "Utilities": "utilities",
  "Technology": "technology",
  "Marketing": "marketing",
  "Travel": "travel",
  "Professional Services": "professional_services",
  "Other": "misc",
  "Equipment": "misc",
  "Insurance": "misc",
  "Training": "misc",
};

const incomeCategories = ["sales", "consulting", "investment"];
const expenseCategories = ["payroll", "rent", "utilities", "technology", "marketing", "travel", "professional_services", "misc"];

export function transactionsToCsv(transactions) {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  // Group transactions by date
  const dateMap = new Map();

  transactions.forEach((tx) => {
    // Handle different date formats
    let date = tx.date;
    if (date.includes("T")) {
      date = date.split("T")[0]; // Get YYYY-MM-DD from ISO format
    } else if (date.includes("/")) {
      // Handle M/D/YYYY format
      const [m, d, y] = date.split("/").map((v) => parseInt(v, 10));
      date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    // If already in YYYY-MM-DD format, use as is
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        sales: 0,
        consulting: 0,
        investment: 0,
        payroll: 0,
        rent: 0,
        utilities: 0,
        technology: 0,
        marketing: 0,
        travel: 0,
        professional_services: 0,
        misc: 0,
      });
    }

    const dayData = dateMap.get(date);
    const csvCategory = categoryMapping[tx.category] || "misc";
    const amount = parseFloat(tx.amount) || 0;

    if (tx.type === "income") {
      if (incomeCategories.includes(csvCategory)) {
        dayData[csvCategory] = (dayData[csvCategory] || 0) + amount;
      }
    } else if (tx.type === "expense") {
      if (expenseCategories.includes(csvCategory)) {
        dayData[csvCategory] = (dayData[csvCategory] || 0) + amount;
      }
    }
  });

  // Convert map to array and sort by date
  const rows = Array.from(dateMap.values()).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Create CSV content
  const headers = [
    "date",
    "sales",
    "consulting",
    "investment",
    "payroll",
    "rent",
    "utilities",
    "technology",
    "marketing",
    "travel",
    "professional_services",
    "misc",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => {
        const value = row[header] || 0;
        return value;
      }).join(",")
    ),
  ];

  return csvRows.join("\n");
}

