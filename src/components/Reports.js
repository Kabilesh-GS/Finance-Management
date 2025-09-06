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
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedChart, setSelectedChart] = useState("line");

  // Calculate monthly data from actual transactions
  const getMonthlyData = () => {
    const monthlyTotals = {};

    transactions.forEach((transaction) => {
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

  // Calculate category spending
  const categoryData = budgets.map((budget) => ({
    name: budget.category,
    value: budget.spent,
    color: budget.color,
  }));

  // Calculate weekly data from actual transactions
  const getWeeklyData = () => {
    const weeklyTotals = {};

    transactions.forEach((transaction) => {
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

  // Calculate summary statistics
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Calculate dynamic insights
  const getTopSpendingCategory = () => {
    const categoryTotals = {};
    transactions
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
    const nonPayrollExpenses = transactions
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
        <span className="text-sm text-gray-600">{change}</span>
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
        <button className="btn btn-primary">
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
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Financial Trends</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                className="select text-sm"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
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

      {/* Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Financial Insights</h3>
        <div className="grid grid-2 gap-6">
          <div className="space-y-4">
            {/* Financial Trend */}
            <div
              className={`p-4 border rounded-lg ${
                financialTrend.type === "positive"
                  ? "bg-green-50 border-green-200"
                  : financialTrend.type === "negative"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <h4
                className={`font-semibold mb-2 ${
                  financialTrend.type === "positive"
                    ? "text-green-900"
                    : financialTrend.type === "negative"
                    ? "text-red-900"
                    : "text-blue-900"
                }`}
              >
                {financialTrend.type === "positive"
                  ? "💰"
                  : financialTrend.type === "negative"
                  ? "📉"
                  : "📊"}{" "}
                Financial Trend
              </h4>
              <p
                className={`text-sm ${
                  financialTrend.type === "positive"
                    ? "text-green-800"
                    : financialTrend.type === "negative"
                    ? "text-red-800"
                    : "text-blue-800"
                }`}
              >
                {financialTrend.message}
              </p>
            </div>

            {/* Top Spending Category */}
            {topSpending && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  📊 Top Spending Category
                </h4>
                <p className="text-sm text-blue-800">
                  {topSpending.category} accounts for{" "}
                  {topSpending.percentage.toFixed(1)}% of your total spending ($
                  {topSpending.amount.toLocaleString()}).
                  {topSpending.percentage > 30
                    ? " Consider reviewing this category for cost optimization opportunities."
                    : " This is a reasonable allocation."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Budget Alerts */}
            {budgetAlerts.length > 0 ? (
              budgetAlerts.slice(0, 2).map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    alert.type === "danger"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <h4
                    className={`font-semibold mb-2 ${
                      alert.type === "danger"
                        ? "text-red-900"
                        : "text-yellow-900"
                    }`}
                  >
                    {alert.type === "danger" ? "🚨" : "⚠️"} Budget Alert
                  </h4>
                  <p
                    className={`text-sm ${
                      alert.type === "danger"
                        ? "text-red-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  ✅ Budget Status
                </h4>
                <p className="text-sm text-green-800">
                  All budget categories are within acceptable limits. Great job
                  managing your finances!
                </p>
              </div>
            )}

            {/* Goal Progress */}
            <div
              className={`p-4 border rounded-lg ${
                goalProgress.type === "good"
                  ? "bg-green-50 border-green-200"
                  : goalProgress.type === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h4
                className={`font-semibold mb-2 ${
                  goalProgress.type === "good"
                    ? "text-green-900"
                    : goalProgress.type === "warning"
                    ? "text-yellow-900"
                    : "text-red-900"
                }`}
              >
                🎯 Budget Progress
              </h4>
              <p
                className={`text-sm ${
                  goalProgress.type === "good"
                    ? "text-green-800"
                    : goalProgress.type === "warning"
                    ? "text-yellow-800"
                    : "text-red-800"
                }`}
              >
                {goalProgress.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
