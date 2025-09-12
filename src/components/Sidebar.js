import React from "react";
import {
  Home,
  CreditCard,
  PieChart,
  BarChart3,
  Settings,
  Brain,
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "budget", label: "Budget", icon: PieChart },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "predictions", label: "Predictions", icon: Brain },
   
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span style={{ fontSize: "30px" }} className="logo-icon">
            💸
          </span>
          <h1 className="logo-text">FinanceApp</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === item.id ? "active" : ""
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/*<div className="sidebar-footer">
        <button className="nav-link">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>*/}
    </aside>
  );
};

export default Sidebar;
