import React from "react";
import {
  Home,
  CreditCard,
  PieChart,
  BarChart3,
  TrendingUp,
  MessageCircle,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ activeTab, onTabChange }) => {
  const { user, logout, getOrganizationName } = useAuth();
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "budget", label: "Budget", icon: PieChart },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "predictions", label: "Predictions", icon: TrendingUp },
    { id: "chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
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

      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <div className="user-details">
              <p className="user-name">{user.name}</p>
              <p className="user-email">{user.email}</p>
            </div>
          </div>
        )}
        <button className="nav-link logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
