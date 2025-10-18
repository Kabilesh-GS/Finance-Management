import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Budget from "./components/Budget";
import Reports from "./components/Reports";
import Predictions from "./components/Predictions";
import ChatBot from "./components/ChatBot";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

import budgetsData from "./models/Dataset/budgets_2024.json";
import { parseCsvTextToTransactions } from "./utils/csvToTransactions";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
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

  // Load saved budgets from localStorage
  const loadSavedBudgets = () => {
    try {
      const saved = localStorage.getItem("financeBudgets");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load saved budgets:", e);
    }
    return null;
  };

  // Save budgets to localStorage
  const saveBudgets = (budgetsToSave) => {
    try {
      localStorage.setItem("financeBudgets", JSON.stringify(budgetsToSave));
    } catch (e) {
      console.error("Failed to save budgets:", e);
    }
  };

  // Load data from CSV on component mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:8000/data/csv");
        if (!res.ok) {
          console.error("CSV fetch failed:", res.status, res.statusText);
          return;
        }
        const text = await res.text();
        const tx = parseCsvTextToTransactions(text);
        setTransactions(tx);

        // Load saved budgets or use defaults
        const savedBudgets = loadSavedBudgets();
        const baseBudgets = savedBudgets || budgetsData;
        const updatedBudgets = calculateSpentAmounts(tx, baseBudgets);
        setBudgets(updatedBudgets);
      } catch (e) {
        console.error("Failed to load CSV", e);
      }
    };
    load();
  }, []);

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

    // Save budgets to localStorage (without spent amounts)
    const budgetsToSave = updatedBudgets.map(({ spent, ...budget }) => budget);
    saveBudgets(budgetsToSave);
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);

    // Update budgets with new spent amounts
    const updatedBudgets = calculateSpentAmounts(updatedTransactions, budgets);
    setBudgets(updatedBudgets);

    // Save budgets to localStorage (without spent amounts)
    const budgetsToSave = updatedBudgets.map(({ spent, ...budget }) => budget);
    saveBudgets(budgetsToSave);
  };

  const updateBudget = (category, newBudget) => {
    const updatedBudgets = budgets.map((b) =>
      b.category === category ? { ...b, budget: newBudget } : b
    );
    setBudgets(updatedBudgets);

    // Save to localStorage (without spent amounts)
    const budgetsToSave = updatedBudgets.map(({ spent, ...budget }) => budget);
    saveBudgets(budgetsToSave);
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
        return <Predictions />;
      case "chat":
        return <ChatBot />;
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
