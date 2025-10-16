import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

const Transactions = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [displayCount, setDisplayCount] = useState(15);
  const [newTransaction, setNewTransaction] = useState({
    type: "expense",
    category: "",
    amount: "",
    description: "",
  });

  const categories = [
    "Sales Revenue",
    "Consulting",
    "Investment",
    "Payroll",
    "Office Rent",
    "Marketing",
    "Technology",
    "Utilities",
    "Travel",
    "Professional Services",
    "Equipment",
    "Insurance",
    "Training",
    "Other",
  ];

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "all" || transaction.type === filterType;
      const matchesCategory =
        filterCategory === "all" || transaction.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by date first (most recent first)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      return dateB.getTime() - dateA.getTime();
    });

  const displayedTransactions = filteredTransactions.slice(0, displayCount);
  const hasMoreTransactions = filteredTransactions.length > displayCount;

  const handleShowMore = () => {
    setDisplayCount((prev) => prev + 15);
  };

  const handleResetDisplayCount = () => {
    setDisplayCount(15);
  };

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(15);
  }, [searchTerm, filterType, filterCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      newTransaction.amount &&
      newTransaction.category &&
      newTransaction.description
    ) {
      onAddTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
      });
      setNewTransaction({
        type: "expense",
        category: "",
        amount: "",
        description: "",
      });
      setShowAddModal(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transactions
          </h1>
          <p className="text-gray-600">
            Manage your income and expenses
            {filteredTransactions.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({displayedTransactions.length} of {filteredTransactions.length}{" "}
                shown)
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-3 gap-4">
          <div className="form-group">
            <label className="form-label">Search</label>
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div
                      className={`flex items-center gap-2 ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      <span className="capitalize font-medium">
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="font-medium">{transaction.description}</td>
                  <td>
                    <span className="badge badge-info">
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`font-semibold ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}₹
                    {transaction.amount.toFixed(2)}
                  </td>
                  <td className="text-gray-600">
                    {formatDate(transaction.date)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-secondary text-sm p-2">
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-danger text-sm p-2"
                        onClick={() => onDeleteTransaction(transaction.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayedTransactions.length === 0 && (
            <div className="text-center py-8">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filters
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={20} />
                Add Your First Transaction
              </button>
            </div>
          )}

          {/* Show More Button */}
          {hasMoreTransactions && displayedTransactions.length > 0 && (
            <div className="text-center py-4 border-t">
              <button className="btn btn-secondary" onClick={handleShowMore}>
                Show More ({filteredTransactions.length - displayCount}{" "}
                remaining)
              </button>
            </div>
          )}

          {/* Show Less Button - only show if we're showing more than 15 */}
          {displayCount > 15 && (
            <div className="text-center py-2">
              <button
                className="btn btn-outline text-sm"
                onClick={handleResetDisplayCount}
              >
                Show Less
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add New Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="select"
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="select"
                  value={newTransaction.category}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      category: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount</label>
                <div className="relative">
                  <DollarSign
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input pl-10"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter description..."
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  Add Transaction
                </button>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
