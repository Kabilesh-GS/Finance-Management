import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("financeUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("financeUser");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("financeUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("financeUser");
  };

  const getOrganizationName = () => {
    if (!user) return "Personal Use";
    if (user.hd && user.hd !== user.email.split("@")[1]) {
      return user.hd;
    }

    if (user.organizationName) {
      return user.organizationName;
    }

    return "Personal Use";
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    getOrganizationName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
