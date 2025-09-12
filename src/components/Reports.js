import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

const Reports = ({ transactions, budgets }) => {
  const [selectedChart, setSelectedChart] = useState("line");

  // Years present in dataset
  const availableYears = Array.from(
    new Set((transactions || []).map((t) => new Date(t.date).getFullYear()))
  ).sort((a, b) => a - b);
  const defaultYear =
    availableYears.length > 0
      ? availableYears[availableYears.length - 1]
      : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  // Filter transactions by selected year
  const yearFilteredTransactions = (transactions || []).filter((t) => {
    const y = new Date(t.date).getFullYear();
    return y === selectedYear;
  });

  // Calculate monthly data from actual transactions (filtered by year)
  const getMonthlyData = () => {
    const monthlyTotals = {};

    yearFilteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString("en-US", { month: "short" });

      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        monthlyTotals[monthKey].income += transaction.amount;
      } else {
        monthlyTotals[monthKey].expenses += transaction.amount;
      }
    });

    // Convert to array format and sort by month
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return Object.entries(monthlyTotals)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      }))
      .sort(
        (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      );
  };

  const monthlyData = getMonthlyData();

  // Calculate category spending (budgets already contain spent, but we keep color/name here)
  const categoryData = budgets.map((budget) => ({
    name: budget.category,
    value: budget.spent,
    color: budget.color,
  }));

  // Calculate weekly data from actual transactions (filtered by year)
  const getWeeklyData = () => {
    const weeklyTotals = {};

    yearFilteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const weekNumber = Math.ceil(date.getDate() / 7);
      const periodKey = `Week ${weekNumber}`;

      if (!weeklyTotals[periodKey]) {
        weeklyTotals[periodKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        weeklyTotals[periodKey].income += transaction.amount;
      } else {
        weeklyTotals[periodKey].expenses += transaction.amount;
      }
    });

    // Convert to array format and sort by week
    const weekOrder = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    return Object.entries(weeklyTotals)
      .map(([period, data]) => ({
        period,
        income: data.income,
        expenses: data.expenses,
      }))
      .sort(
        (a, b) => weekOrder.indexOf(a.period) - weekOrder.indexOf(b.period)
      );
  };

  const trendData = getWeeklyData();

  const COLORS = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  // Calculate summary statistics (filtered by year)
  const totalIncome = yearFilteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = yearFilteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Export current report as CSV
  const exportReport = () => {
    const lines = [];
    lines.push(`Year,${selectedYear}`);
    lines.push("");
    lines.push("Summary");
    lines.push("Metric,Amount");
    lines.push(`Total Income,${totalIncome}`);
    lines.push(`Total Expenses,${totalExpenses}`);
    lines.push(`Net Savings,${netSavings}`);
    lines.push(`Savings Rate (%),${savingsRate.toFixed(2)}`);
    lines.push("");

    lines.push("Monthly Totals");
    lines.push("Month,Income,Expenses,Savings");
    monthlyData.forEach((m) => {
      lines.push(`${m.month},${m.income},${m.expenses},${m.savings}`);
    });
    lines.push("");

    lines.push("Weekly Trend");
    lines.push("Period,Income,Expenses");
    trendData.forEach((w) => {
      lines.push(`${w.period},${w.income},${w.expenses}`);
    });
    lines.push("");

    lines.push("Category Spending (from budgets)");
    lines.push("Category,Spent");
    categoryData.forEach((c) => {
      lines.push(`${c.name},${c.value}`);
    });

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financial_report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate dynamic insights
  const getTopSpendingCategory = () => {
    const categoryTotals = {};
    yearFilteredTransactions
      .filter((t) => t.type === "expense" && t.category !== "Payroll")
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      });

    const sortedCategories = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedCategories.length === 0) return null;

    const [topCategory, amount] = sortedCategories[0];
    // Calculate percentage excluding payroll from total expenses
    const nonPayrollExpenses = yearFilteredTransactions
      .filter((t) => t.type === "expense" && t.category !== "Payroll")
      .reduce((sum, t) => sum + t.amount, 0);
    const percentage =
      nonPayrollExpenses > 0 ? (amount / nonPayrollExpenses) * 100 : 0;

    return { category: topCategory, amount, percentage };
  };

  const getBudgetAlerts = () => {
    const alerts = [];
    budgets.forEach((budget) => {
      // Skip payroll from budget alerts as it's typically a fixed operational cost
      if (budget.category === "Payroll") return;

      const percentage = (budget.spent / budget.budget) * 100;
      if (percentage >= 100) {
        alerts.push({
          type: "danger",
          category: budget.category,
          message: `You've exceeded your ${budget.category.toLowerCase()} budget by ₹${(
            budget.spent - budget.budget
          ).toFixed(2)}`,
          percentage: percentage.toFixed(1),
        });
      } else if (percentage >= 80) {
        alerts.push({
          type: "warning",
          category: budget.category,
          message: `You're approaching your ${budget.category.toLowerCase()} budget limit (${percentage.toFixed(
            1
          )}% used)`,
          percentage: percentage.toFixed(1),
        });
      }
    });
    return alerts;
  };

  const getFinancialTrend = () => {
    if (savingsRate > 20) {
      return {
        type: "positive",
        message: `Excellent savings rate of ${savingsRate.toFixed(
          1
        )}%! You're building strong financial reserves.`,
        rate: savingsRate,
      };
    } else if (savingsRate > 10) {
      return {
        type: "positive",
        message: `Good savings rate of ${savingsRate.toFixed(
          1
        )}%. Consider increasing your savings target.`,
        rate: savingsRate,
      };
    } else if (savingsRate > 0) {
      return {
        type: "neutral",
        message: `Your savings rate is ${savingsRate.toFixed(
          1
        )}%. Look for opportunities to increase savings.`,
        rate: savingsRate,
      };
    } else {
      return {
        type: "negative",
        message: `You're spending more than you're earning. Review your expenses and income streams.`,
        rate: savingsRate,
      };
    }
  };

  const getGoalProgress = () => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const progressPercentage =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    if (progressPercentage < 70) {
      return {
        type: "good",
        message: `You're managing your budget well. ${progressPercentage.toFixed(
          1
        )}% of budget used.`,
        progress: progressPercentage,
      };
    } else if (progressPercentage < 90) {
      return {
        type: "warning",
        message: `Budget utilization is at ${progressPercentage.toFixed(
          1
        )}%. Monitor spending closely.`,
        progress: progressPercentage,
      };
    } else {
      return {
        type: "danger",
        message: `High budget utilization at ${progressPercentage.toFixed(
          1
        )}%. Consider budget adjustments.`,
        progress: progressPercentage,
      };
    }
  };

  const topSpending = getTopSpendingCategory();
  const budgetAlerts = getBudgetAlerts();
  const financialTrend = getFinancialTrend();
  const goalProgress = getGoalProgress();

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="card hover-scale">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600">{title}</p>
    </div>
  );

  const renderChart = () => {
    switch (selectedChart) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, ""]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={3}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, ""]} />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, ""]} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial Reports
          </h1>
          <p className="text-gray-600">
            Analyze your financial trends and patterns
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportReport}>
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-4 mb-8">
        <StatCard
          title="Total Income"
          value={`₹${totalIncome.toLocaleString()}`}
          change="+12.5%"
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          change="+5.2%"
          icon={BarChart3}
          color="bg-red-500"
        />
        <StatCard
          title="Net Savings"
          value={`₹${netSavings.toLocaleString()}`}
          change={netSavings >= 0 ? "+8.3%" : "-2.1%"}
          icon={PieChart}
          color={netSavings >= 0 ? "bg-blue-500" : "bg-red-500"}
        />
        <StatCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          change="+2.1%"
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Chart Controls */}
      <div className="card mb-6 mt-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Financial Trends</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                className="select text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                className="select text-sm"
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
          </div>
        </div>
        {renderChart()}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-2 gap-6 mb-8">
        {/* Category Spending */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
              <Legend
                payload={categoryData.map((entry, index) => ({
                  value: entry.name,
                  type: "rect",
                  color: COLORS[index % COLORS.length],
                }))}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            Weekly Income vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value}`, ""]} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
