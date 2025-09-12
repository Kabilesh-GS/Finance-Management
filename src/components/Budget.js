import React, { useState } from "react";
import {
  Target,
  Edit,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";

const Budget = ({ budgets, transactions, onUpdateBudget }) => {
  const [editingBudget, setEditingBudget] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  // Year selection derived from transactions
  const availableYears = Array.from(
    new Set((transactions || []).map((t) => new Date(t.date).getFullYear()))
  ).sort((a, b) => a - b);
  const defaultYear =
    availableYears.length > 0
      ? availableYears[availableYears.length - 1]
      : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const handleEditStart = (budget) => {
    setEditingBudget(budget.category);
    setEditAmount(budget.budget.toString());
  };

  const handleEditSave = () => {
    if (editAmount && !isNaN(editAmount) && parseFloat(editAmount) > 0) {
      onUpdateBudget(editingBudget, parseFloat(editAmount));
      setEditingBudget(null);
      setEditAmount("");
    }
  };

  const handleEditCancel = () => {
    setEditingBudget(null);
    setEditAmount("");
  };

  const getProgressPercentage = (spent, budget) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 80) return "#f59e0b";
    return "#10b981";
  };

  const getRemainingAmount = (budget, spent) => {
    return Math.max(budget - spent, 0);
  };

  // Filter transactions by selected year
  const yearFilteredTransactions = (transactions || []).filter((t) => {
    const y = new Date(t.date).getFullYear();
    return y === selectedYear;
  });

  // Compute spent per category for the selected year
  const categoryToYearSpent = yearFilteredTransactions.reduce((acc, t) => {
    if (t.type !== "expense") return acc;
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Budget Management
        </h1>
        <p className="text-gray-600">
          Track your spending against your budget goals
        </p>
      </div>

      {/* Year Selector */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Budget Categories</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Year</span>
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
        </div>
      </div>

      {/* Budget Categories */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">
          Budget Categories for {selectedYear}
        </h3>
        <div className="space-y-6">
          {budgets.map((budget) => {
            const yearSpent = categoryToYearSpent[budget.category] || 0;
            const progressPercentage = getProgressPercentage(
              yearSpent,
              budget.budget
            );
            const progressColor = getProgressColor(progressPercentage);
            const remaining = getRemainingAmount(budget.budget, yearSpent);
            const isOverBudget = yearSpent > budget.budget;

            return (
              <div
                key={budget.category}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: budget.color }}
                    ></div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {budget.category}
                    </h4>
                    {isOverBudget && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle size={16} />
                        <span className="text-sm font-medium">Over Budget</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingBudget === budget.category ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="input w-24 text-sm"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={handleEditSave}
                          className="btn btn-success text-sm p-2"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="btn btn-secondary text-sm p-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(budget)}
                        className="btn btn-secondary text-sm"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{budget.budget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Spent</p>
                    <p className="text-lg font-semibold text-red-600">
                      ₹{yearSpent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining</p>
                    <p
                      className={`text-lg font-semibold ${
                        remaining > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{remaining.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: progressColor,
                      }}
                    ></div>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-medium">
                        You've exceeded your budget by ₹
                        {(budget.spent - budget.budget).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Budget;
