import React from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.svg';
import { FaShoppingCart } from 'react-icons/fa';
import logo2 from '../assets/logo.png';
import { motion } from 'framer-motion'; 
import './forgotpassword.css';

function ForgotPassword() {
    return (
        <motion.div
            className="forgotPassword"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <header className="Header">
                <a href="/"><img src={logo} className="App-logo" alt="WildBites Logo" /> </a>

            </header>

            <hr />

            <div className="ForgotPassword-container">
                <div className="input-container">
                    <img src={logo2} alt="Logo2" />
                    <h2>Use your University Account</h2>
                    <p className="p1">Please check your email for a message with your code.</p>
                    <p className="p2">Your code is 6 numeric digits long.</p>
                    <form>
                        <input
                            type="text"
                            placeholder="Enter Email"
                            className="email-input"
                        />
                        <br />
                        <button type="submit" className="continue-btn">Continue</button>
                        <a href="/login">Back to Login</a>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}

export default ForgotPassword;
