import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Budget from "./components/Budget";
import Reports from "./components/Reports";
import Predictions from "./components/Predictions";
import ChatBot from "./components/ChatBot";
import Other from "./components/Other";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

import budgetsData from "./models/Dataset/budgets_2024.json";
import { parseCsvTextToTransactions } from "./utils/csvToTransactions";

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Calculate actual spent amounts from transactions
  const calculateSpentAmounts = (transactions, budgets) => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spent };
    });
  };

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      // Load transactions
      const savedTransactions = localStorage.getItem("financeTransactions");
      if (savedTransactions) {
        const tx = JSON.parse(savedTransactions);
        setTransactions(tx);
      }

      // Load budgets
      const savedBudgets = localStorage.getItem("financeBudgets");
      const loadedTransactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];
      if (savedBudgets) {
        const savedBudgetsData = JSON.parse(savedBudgets);
        setBudgets(calculateSpentAmounts(loadedTransactions, savedBudgetsData));
      } else {
        // Initialize with default budgets if none saved
        setBudgets(calculateSpentAmounts(loadedTransactions, budgetsData));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage:", e);
      // Initialize with default budgets on error
      setBudgets(calculateSpentAmounts([], budgetsData));
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("financeTransactions", JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions to localStorage:", e);
    }
  }, [transactions]);

  // Save budgets to localStorage whenever they change (without spent amounts)
  useEffect(() => {
    try {
      const budgetsToSave = budgets.map(({ spent, ...b }) => b);
      localStorage.setItem("financeBudgets", JSON.stringify(budgetsToSave));
    } catch (e) {
      console.error("Failed to save budgets to localStorage:", e);
    }
  }, [budgets]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
    };
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);

    // Update budgets with new spent amounts
    const updatedBudgets = calculateSpentAmounts(updatedTransactions, budgets);
    setBudgets(updatedBudgets);
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);

    // Update budgets with new spent amounts
    const updatedBudgets = calculateSpentAmounts(updatedTransactions, budgets);
    setBudgets(updatedBudgets);
  };

  const updateBudget = (category, newBudget) => {
    const updatedBudgets = budgets.map((b) =>
      b.category === category ? { ...b, budget: newBudget } : b
    );
    setBudgets(updatedBudgets);
  };

  const importTransactionsFromCsv = (csvText) => {
    try {
      const tx = parseCsvTextToTransactions(csvText);
      setTransactions(tx);
      const updatedBudgets = calculateSpentAmounts(tx, budgetsData);
      setBudgets(updatedBudgets);
    } catch (e) {
      console.error("Failed to import CSV", e);
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard transactions={transactions} budgets={budgets} />;
      case "transactions":
        return (
          <Transactions
            transactions={transactions}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            onImportCsv={importTransactionsFromCsv}
          />
        );
      case "budget":
        return (
          <Budget
            budgets={budgets}
            transactions={transactions}
            onUpdateBudget={updateBudget}
          />
        );
      case "reports":
        return <Reports transactions={transactions} budgets={budgets} />;
      case "predictions":
        return <Predictions transactions={transactions} />;
      case "chat":
        return <ChatBot transactions={transactions} />;
      case "other":
        return <Other />;
      default:
        return <Dashboard transactions={transactions} budgets={budgets} />;
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">{renderActiveComponent()}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
