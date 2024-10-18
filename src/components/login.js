import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import "./login.css";
import loghead from "../assets/loginhead.svg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgotPasswordClick = () => {
    navigate("/forgotpassword");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if the email is the admin email
      if (user.email === "admin@admin.com") {
        navigate("/admin");
      } else {
        navigate("/onlineclient");
      }
    } catch (error) {
      let errorMessage = "";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No user found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        default:
          errorMessage = "Login failed. Please try again.";
      }
      setError(errorMessage);
      console.error("Login error:", errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user is new and create a profile in Firestore
      const userDoc = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDoc);

      //creates a profile for new users
      if (!userSnapshot.exists()) {
        await setDoc(userDoc, {
          name: user.displayName,
          email: user.email,
          uid: user.uid,
        });
      }

      // Check if the email is the admin email if not go to onlineclient
      if (user.email === "admin@admin.com") {
        navigate("/admin");
      } else {
        navigate("/onlineclient");
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setError("Sign in with Google failed. Please try again.");
    }
  };

  return (
    <motion.div
      className="login-auth-container"
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 0 }}
      transition={{ duration: 0.1 }}
    >
      <header className="login-auth-header">
        <Link to="/">
          <a href="/">
            <img src={loghead} className="login-loghead" alt="logheader" />
          </a>
        </Link>
      </header>

      <form onSubmit={handleLogin} className="login-auth-form">
        <div className="login-form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div className="login-form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>
        {error && <p className="login-error-message">{error}</p>}
        <button type="submit" className="login-btn login-submit-btn">
          Log In
        </button>
      </form>

      <button
        onClick={handleForgotPasswordClick}
        className="login-forgot-password-btn"
      >
        Forgot Password?
      </button>

      <p className="login-continue-p">-- Or continue with --</p>

      <button
        onClick={signInWithGoogle}
        className="login-btn login-google-signin-btn"
      >
        <img
          src={require("../assets/google.png")}
          alt="Sign in with Google"
          width="60%"
        />
      </button>

      <p>
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="login-btn login-toggle-btn"
        >
          Sign Up
        </button>
      </p>
    </motion.div>
  );
}

export default Login;
