import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import InputMask from "react-input-mask";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import "./signup.css";
import loghead from "../assets/loginhead.svg";

function Signup() {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [schoolIDNumber, setSchoolIDNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [schoolIDValid, setSchoolIDValid] = useState(true);
  const [contactNumberValid, setContactNumberValid] = useState(true);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const schoolIDRegex = /^\d{2}-\d{4}-\d{3}$/;
    if (!schoolIDRegex.test(schoolIDNumber)) {
      setError("School ID Number must be in the format ##-####-###.");
      setSchoolIDValid(false);
      return;
    } else {
      setSchoolIDValid(true);
    }

    const contactNumberRegex = /^\+63\s\d{10}$/;
    if (!contactNumberRegex.test(contactNumber)) {
      setError("Contact Number must be in the format +63 ##########.");
      setContactNumberValid(false);
      return;
    } else {
      setContactNumberValid(true);
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        course,
        schoolIDNumber,
        contactNumber,
        email: user.email,
        uid: user.uid,
      });

      window.alert("Account created successfully!");
      navigate("/login");
    } catch (error) {
      let errorMessage = "";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already in use.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/weak-password":
          errorMessage =
            "Password is too weak. It should be at least 6 characters.";
          break;
        default:
          errorMessage = "Registration failed. Please try again.";
      }
      setError(errorMessage);
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
      className="signup-container"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 1, x: 0 }}
      transition={{ duration: 0 }}
    >
      <header className="signup-header">
        <Link to="/">
          <img src={loghead} className="signup-loghead" alt="logheader" />
        </Link>
      </header>

      <form onSubmit={handleRegister} className="signup-form">
        <div className="signup-form-group">
          <label htmlFor="name">Complete Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </div>
        <div className="signup-form-group">
          <label htmlFor="course">Course/Year:</label>
          <input
            type="text"
            id="course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
            placeholder="e.g., B.Tech / 3rd Year"
          />
        </div>
        <div className="signup-form-group">
          <label htmlFor="schoolIDNumber">School ID Number:</label>
          <InputMask
            mask="99-9999-999"
            maskChar=""
            id="schoolIDNumber"
            value={schoolIDNumber}
            onChange={(e) => setSchoolIDNumber(e.target.value)}
            required
            placeholder="12-3456-789"
          >
            {(inputProps) => (
              <input
                {...inputProps}
                type="text"
                className={!schoolIDValid ? "signup-invalid" : ""}
              />
            )}
          </InputMask>
          {!schoolIDValid && (
            <span className="signup-error-text">
              Invalid School ID Number format.
            </span>
          )}
        </div>
        <div className="signup-form-group">
          <label htmlFor="contactNumber">Contact Number:</label>
          <InputMask
            mask="+63 9999999999"
            maskChar=""
            id="contactNumber"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
            placeholder="+63 9123456789"
          >
            {(inputProps) => (
              <input
                {...inputProps}
                type="tel"
                className={!contactNumberValid ? "signup-invalid" : ""}
              />
            )}
          </InputMask>
          {!contactNumberValid && (
            <span className="signup-error-text">
              Invalid Contact Number format.
            </span>
          )}
        </div>
        <div className="signup-form-group">
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
        <div className="signup-form-group">
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
        <div className="signup-form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter your password"
          />
        </div>
        {error && <p className="signup-error-message">{error}</p>}

        <button type="submit" className="signup-btn">
          Sign Up
        </button>
      </form>

      <p className="signup-continue-p">-- Or continue with --</p>

      <button onClick={signInWithGoogle} className="signup-google-signin-btn">
        <img
          src={require("../assets/google.png")}
          alt="Sign in with Google"
          width="60%"
        />
      </button>

      <p className="signup-account-container">
        Already have an account?{" "}
        <button
          onClick={() => navigate("/login")}
          className="signup-toggle-btn"
        >
          Log In
        </button>
      </p>
    </motion.div>
  );
}

export default Signup;
