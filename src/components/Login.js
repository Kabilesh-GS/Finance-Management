import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

const Login = () => {

  const { login } = useAuth();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">FinanceApp</h1>
          <p className="login-subtitle">
            Sign in to access your financial dashboard
          </p>
        </div>

        <div className="login-content">
          <button className="google-signin-container" onClick={login}>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
