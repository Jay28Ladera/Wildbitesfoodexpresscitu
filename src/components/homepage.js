import React, { useState } from 'react';
import logo from '../assets/logo.svg';
import cat from '../assets/cat.svg';
import './homepage.css';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion'; 

function Homepage() {
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const addToCart = () => {
        setCartCount(cartCount + 1);
    };

    const handleOrderClick = () => {
        navigate('/login');
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleSignupClick = () => {
        navigate('/signup');
    };

    const bounceTransition = {
        duration: 0.5,
        yoyo: 2, 
        ease: 'easeOut',
    };

    return (
        <motion.div
            className="App"
            initial={location.state?.fromSignup ? { opacity: 0, x: 0 } : { opacity: 0, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: 0 }} 
            transition={{ duration: 0.5 }}
        >
            <nav className="navbar">
                <div className="navbar-logo">
                    <img src={logo} className="App-logo" alt="WildBites Logo" />
                </div>

                <div className="navbar-actions">
                    <motion.button
                        className="btn login-btn"
                        whileHover={{ scale: 1.1, y: ['0%', '-30%', '0%'] }}
                        transition={bounceTransition}
                        onClick={handleLoginClick}
                    >
                        Log In
                    </motion.button>
                    <motion.button
                        className="btn signup-btn"
                        whileHover={{ scale: 1.1, y: ['0%', '-30%', '0%'] }}
                        transition={bounceTransition}
                        onClick={handleSignupClick}
                    >
                        Sign Up
                    </motion.button>
                    <motion.button
                        className="btn cart-btn"
                        whileHover={{ scale: 1.1, y: ['0%', '-30%', '0%'] }}
                        transition={bounceTransition}
                        aria-label="View Cart"
                    >
                        <FaShoppingCart size={20} />
                        <span className="cart-count">{cartCount}</span>
                    </motion.button>
                </div>
            </nav>

            <header className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>WildBites</h1>
                        <h2>CIT-U Food Express</h2>
                        <p>Fast. Fresh. Fierce.</p>
                        <motion.button
                            className="btn order-btn"
                            whileHover={{ scale: 1.1, y: ['0%', '-30%', '0%'] }}
                            transition={bounceTransition}
                            onClick={handleOrderClick}
                        >
                            Order Now
                        </motion.button>
                    </div>
                    
                    <img src={cat} alt="WildBites Logo" className="hero-logo-image" />
                </div>
            </header>
        </motion.div>
    );
}

export default Homepage;
