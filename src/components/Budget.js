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

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budget, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

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

      {/* Budget Overview */}
      <div className="grid grid-3 mb-8">
        <div className="card hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Target size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{totalBudget.toLocaleString()}
              </h3>
              <p className="text-gray-600">Total Budget</p>
            </div>
          </div>
        </div>

        <div className="card hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-red-50">
              <DollarSign size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{totalSpent.toLocaleString()}
              </h3>
              <p className="text-gray-600">Total Spent</p>
            </div>
          </div>
        </div>

        <div className="card hover-scale">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{totalRemaining.toLocaleString()}
              </h3>
              <p className="text-gray-600">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">Budget Categories</h3>
        <div className="space-y-6">
          {budgets.map((budget) => {
            const progressPercentage = getProgressPercentage(
              budget.spent,
              budget.budget
            );
            const progressColor = getProgressColor(progressPercentage);
            const remaining = getRemainingAmount(budget.budget, budget.spent);
            const isOverBudget = budget.spent > budget.budget;

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
                      ₹{budget.spent.toLocaleString()}
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

      {/* Budget Tips */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">Budget Tips</h3>
        <div className="grid grid-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Track Regularly
            </h4>
            <p className="text-sm text-blue-800">
              Review your spending weekly to stay on track with your budget
              goals.
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">
              Set Realistic Goals
            </h4>
            <p className="text-sm text-green-800">
              Make sure your budget categories reflect your actual spending
              patterns.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">
              Emergency Fund
            </h4>
            <p className="text-sm text-yellow-800">
              Consider setting aside 10-20% of your income for unexpected
              expenses.
            </p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">
              Review & Adjust
            </h4>
            <p className="text-sm text-purple-800">
              Adjust your budget monthly based on your actual spending and
              income.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
