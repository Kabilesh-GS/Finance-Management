import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Budget from "./components/Budget";
import Reports from "./components/Reports";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: "income",
      category: "Sales Revenue",
      amount: 45000.0,
      description: "Q1 Product Sales - TechCorp Solutions",
      date: "2024-01-15",
      time: "14:30",
    },
    {
      id: 2,
      type: "expense",
      category: "Payroll",
      amount: 28000.0,
      description: "Monthly Employee Salaries",
      date: "2024-01-01",
      time: "09:00",
    },
    {
      id: 3,
      type: "expense",
      category: "Office Rent",
      amount: 8500.0,
      description: "Downtown Office Space - January",
      date: "2024-01-01",
      time: "08:00",
    },
    {
      id: 4,
      type: "expense",
      category: "Marketing",
      amount: 12000.0,
      description: "Digital Marketing Campaign - Q1",
      date: "2024-01-10",
      time: "11:00",
    },
    {
      id: 5,
      type: "income",
      category: "Consulting",
      amount: 15000.0,
      description: "Enterprise Consulting Services",
      date: "2024-01-12",
      time: "16:00",
    },
    {
      id: 6,
      type: "expense",
      category: "Technology",
      amount: 5500.0,
      description: "Software Licenses & Cloud Services",
      date: "2024-01-08",
      time: "10:30",
    },
    {
      id: 7,
      type: "expense",
      category: "Utilities",
      amount: 3200.0,
      description: "Office Utilities - January",
      date: "2024-01-05",
      time: "09:15",
    },
    {
      id: 8,
      type: "income",
      category: "Investment",
      amount: 25000.0,
      description: "Series A Funding Round",
      date: "2024-01-20",
      time: "15:45",
    },
    {
      id: 9,
      type: "expense",
      category: "Travel",
      amount: 4800.0,
      description: "Business Travel - Client Meetings",
      date: "2024-01-18",
      time: "13:20",
    },
    {
      id: 10,
      type: "expense",
      category: "Professional Services",
      amount: 7500.0,
      description: "Legal & Accounting Services",
      date: "2024-01-14",
      time: "12:00",
    },
  ]);

  const [budgets, setBudgets] = useState([
    { category: "Payroll", budget: 30000, spent: 28000, color: "#ef4444" },
    { category: "Marketing", budget: 15000, spent: 12000, color: "#3b82f6" },
    { category: "Office Rent", budget: 10000, spent: 8500, color: "#10b981" },
    { category: "Technology", budget: 8000, spent: 5500, color: "#f59e0b" },
    {
      category: "Professional Services",
      budget: 10000,
      spent: 7500,
      color: "#8b5cf6",
    },
    { category: "Travel", budget: 6000, spent: 4800, color: "#ec4899" },
    { category: "Utilities", budget: 4000, spent: 3200, color: "#06b6d4" },
    { category: "Equipment", budget: 5000, spent: 2100, color: "#84cc16" },
  ]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
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
