import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../services/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mapped = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          imageUrl: firebaseUser.photoURL,
          hd: firebaseUser.email?.split("@")[1] || null,
          organizationName: firebaseUser.email?.split("@")[1]
            ? firebaseUser.email
                .split("@")[1]
                .split(".")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : null,
        };
        setUser(mapped);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const getOrganizationName = () => {
    if (!user) return "Personal Use";

    // Check if it's a personal email service
    const personalEmailDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
    ];
    const emailDomain = user.email?.split("@")[1];

    if (personalEmailDomains.includes(emailDomain)) {
      return "Personal Use";
    }

    if (user.hd && user.hd !== emailDomain) {
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
