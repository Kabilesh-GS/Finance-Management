import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();

  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          }
        );
      } else {
        console.error("Google Identity Services failed to load");
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google Identity Services script");
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = (response) => {
    console.log("Google Sign-In Response:", response);

    if (!response.credential) {
      console.error("No credential received from Google");
      alert("Authentication failed. Please try again.");
      return;
    }

    try {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      console.log("Decoded JWT payload:", payload);

      const userData = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        imageUrl: payload.picture,
        hd: payload.hd,
        organizationName: payload.hd
          ? payload.hd
              .split(".")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : null,
      };

      console.log("User data:", userData);
      login(userData);
    } catch (error) {
      console.error("Error decoding JWT token:", error);
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Finance Management</h1>
          <p className="login-subtitle">
            Sign in to access your financial dashboard
          </p>
        </div>

        <div className="login-content">
          <div
            id="google-signin-button"
            className="google-signin-container"
          ></div>

          <div className="login-info">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our terms of service and privacy
              policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
