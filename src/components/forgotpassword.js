import React from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.svg';
import { FaShoppingCart } from 'react-icons/fa';
import logo2 from '../assets/logo.png'
import './forgotpassword.css';

function ForgotPassword() {
    
    return(
        
        <div className="forgotPassword">
            <header className="Header">
                <img src={logo} className="App-logo" alt="WildBites Logo" />

            </header>

            <hr></hr>

            <div className="ForgotPassword-container">
                <div className="input-container">
                    <img src={logo2} alt="Logo2"/>
                    <h2>Use your University Account</h2>
                    <p className="p1">Please check your email for a message with your code.</p>
                    <p className="p2">Your code is 6 numeric digits long.</p>
                    <form>
                        <input
                             type="text"
                             placeholder="Enter Code"
                            className="code-input"
                            />
                            <br></br>
                        <button type="submit" className="continue-btn">Continue</button>

                        <a href="/login">Back to Login</a>

                    </form>
                </div>
            </div>

        </div>
    );
}

export default ForgotPassword;