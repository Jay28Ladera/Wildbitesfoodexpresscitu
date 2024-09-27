import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore"; // Firestore imports for database operations
import logo from '../assets/logo.svg';
import logo2 from '../assets/logo.png';
import { motion } from 'framer-motion'; 
import './forgotpassword.css';

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Function to handle password reset
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        try {
            // Send password reset email
            await sendPasswordResetEmail(auth, email);
            
            // Log the request to Firestore
            await addDoc(collection(db, "passwordResetRequests"), {
                email: email,
                timestamp: new Date()
            });

            setMessage("Password reset email sent. Please check your inbox.");
            setError(""); // Clear error if successful
        } catch (error) {
            setError(`Failed to send reset email: ${error.message}`);
            setMessage(""); // Clear message if there's an error
        }
    };
    
    return (
        <motion.div
            className="forgotPassword"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <header className="Header">
                <a href="/"><img src={logo} className="homelogo" alt="WildBites Logo" /></a>
            </header>

            <hr />

            <div className="ForgotPassword-container">
                <div className="input-container">
                    <img src={logo2} alt="Logo2" />
                    <h2>Use your University Account</h2>
                    <p className="p1">Enter your email address, and we'll send you a link to reset your password.</p>
                    <p className="p2">Please check your inbox for further instructions.</p>
                    <form onSubmit={handleForgotPassword}>
                        <input
                            type="email"
                            placeholder="Enter Email"
                            className="email-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} // Update email state
                            required
                        />
                        <button type="submit" className="continue-btn">Continue</button>
                        <a href="/login">Back to Login</a>
                    </form>
                    {/* Display success or error messages */}
                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}
                </div>
            </div>
        </motion.div>
    );
}

export default ForgotPassword;
