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
import { db } from "./services/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

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

  // Load and live-sync data per logged-in user; clear immediately on user change
  useEffect(() => {
    // Clear current state when user changes (prevents previous user's data flash)
    setTransactions([]);
    setBudgets(calculateSpentAmounts([], budgetsData));

    if (!user) return;

    const userDocRef = doc(collection(db, "users"), user.id);
    // Ensure the doc exists; if not, seed defaults once
    getDoc(userDocRef)
      .then(async (snapshot) => {
        if (!snapshot.exists()) {
          await setDoc(userDocRef, { transactions: [], budgets: budgetsData });
        }
      })
      .catch((e) => console.error("Failed to ensure user doc", e));

    // Subscribe to changes for this user
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        const data = snap.data() || {};
        const tx = data.transactions || [];
        const baseBudgets = data.budgets || budgetsData;
        setTransactions(tx);
        setBudgets(calculateSpentAmounts(tx, baseBudgets));
      },
      (err) => console.error("User doc subscription error", err)
    );

    return () => {
      unsub();
    };
  }, [user]);

  const addTransaction = async (transaction) => {
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

    // Persist to Firestore per user
    try {
      if (user) {
        const userDocRef = doc(collection(db, "users"), user.id);
        const budgetsToSave = updatedBudgets.map(({ spent, ...b }) => b);
        await setDoc(
          userDocRef,
          { transactions: updatedTransactions, budgets: budgetsToSave },
          { merge: true }
        );
      }
    } catch (e) {
      console.error("Failed to save transaction", e);
    }
  };

  const deleteTransaction = async (id) => {
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTransactions);

    // Update budgets with new spent amounts
    const updatedBudgets = calculateSpentAmounts(updatedTransactions, budgets);
    setBudgets(updatedBudgets);

    // Persist to Firestore per user
    try {
      if (user) {
        const userDocRef = doc(collection(db, "users"), user.id);
        const budgetsToSave = updatedBudgets.map(({ spent, ...b }) => b);
        await setDoc(
          userDocRef,
          { transactions: updatedTransactions, budgets: budgetsToSave },
          { merge: true }
        );
      }
    } catch (e) {
      console.error("Failed to delete transaction", e);
    }
  };

  const updateBudget = async (category, newBudget) => {
    const updatedBudgets = budgets.map((b) =>
      b.category === category ? { ...b, budget: newBudget } : b
    );
    setBudgets(updatedBudgets);

    // Persist to Firestore per user
    try {
      if (user) {
        const userDocRef = doc(collection(db, "users"), user.id);
        const budgetsToSave = updatedBudgets.map(({ spent, ...b }) => b);
        await setDoc(userDocRef, { budgets: budgetsToSave }, { merge: true });
      }
    } catch (e) {
      console.error("Failed to update budget", e);
    }
  };

  const importTransactionsFromCsv = async (csvText) => {
    try {
      const tx = parseCsvTextToTransactions(csvText);
      setTransactions(tx);
      const updatedBudgets = calculateSpentAmounts(tx, budgetsData);
      setBudgets(updatedBudgets);

      if (user) {
        const userDocRef = doc(collection(db, "users"), user.id);
        const budgetsToSave = updatedBudgets.map(({ spent, ...b }) => b);
        await setDoc(
          userDocRef,
          { transactions: tx, budgets: budgetsToSave },
          { merge: true }
        );
      }
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
        return <ChatBot />;
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
