import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Budget from "./components/Budget";
import Reports from "./components/Reports";
import Predictions from "./components/Predictions";
import "./App.css";

import budgetsData from "../src/Dataset/budgets_2024.json";
import { parseCsvTextToTransactions } from "./utils/csvToTransactions";

function App() {
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

  // Load data from CSV on component mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/company_finances_daily_2024_2025.csv");
        if (!res.ok) {
          console.error("CSV fetch failed:", res.status, res.statusText);
          return;
        }
        const text = await res.text();
        const tx = parseCsvTextToTransactions(text);
        setTransactions(tx);
        const updatedBudgets = calculateSpentAmounts(tx, budgetsData);
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
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);

    // Update budgets with new spent amounts
    const updatedBudgets = calculateSpentAmounts(updatedTransactions, budgets);
    setBudgets(updatedBudgets);
  };

  const updateBudget = (category, newBudget) => {
    setBudgets(
      budgets.map((b) =>
        b.category === category ? { ...b, budget: newBudget } : b
      )
    );
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
        return <Predictions transactions={transactions} budgets={budgets} />;
      default:
        return <Dashboard transactions={transactions} budgets={budgets} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">{renderActiveComponent()}</main>
    </div>
  );
}

export default App;
