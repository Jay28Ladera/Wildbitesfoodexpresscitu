import React, { useState } from 'react';
import logo from './logo.svg'; // Corrected the variable name
import cat from './cat.svg'; 
import './homepage.css';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Homepage() {
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate(); // Initialize useNavigate

    // Example function to add items to the cart
    const addToCart = () => {
        setCartCount(cartCount + 1);
    };

    // Function to navigate to the login page
    const handleOrderClick = () => {
        navigate('/login'); // Navigate to the login page
    };

    return (
        <div className="App">
            {/* Navigation Bar */}
            <nav className="navbar">
                {/* Logo and Brand Name */}
                <div className="navbar-logo">
                    <img src={logo} className="App-logo" alt="WildBites Logo" />
                </div>

                {/* Authentication Buttons and Cart Icon */}
                <div className="navbar-actions">
                    <button className="btn login-btn">Log In</button>
                    <button className="btn signup-btn">Sign Up</button>
                    <button className="btn cart-btn" aria-label="View Cart">
                        <FaShoppingCart size={20} />
                        <span className="cart-count">{cartCount}</span>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>WildBites</h1>
                        <h2>CIT-U Food Express</h2>
                        <p>Fast. Fresh. Fierce.</p>
                        <button className="btn order-btn" onClick={handleOrderClick}>Order Now</button>
                    </div>
                    <div className="hero-logo">
                        <img src={cat} alt="WildBites Logo" className="hero-logo-image" />
                    </div>
                </div>
            </header>
        </div>
    );
}

export default Homepage;
