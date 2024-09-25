import React, { useState } from 'react';
import logo from '../assets/logo.svg';
import cat from '../assets/cat.svg'; 
import './homepage.css';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import landing from '../assets/landingpage.svg';

function Homepage() {
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();

    const addToCart = () => {
        setCartCount(cartCount + 1);
    };

    const handleOrderClick = () => {
        navigate('/login');
    };
    const handleLoginClick = () => {
        navigate('/login');
    }

    return (
        <div className="App">

            <nav className="navbar">
                <div className="navbar-logo">
                    <a href='/'><img src={logo} className="App-logo" alt="WildBites Logo" /></a>
                </div>

                <div className="navbar-actions">
                    <button className="btn login-btn" onClick={handleLoginClick}>Log In</button>
                    <button className="btn signup-btn">Sign Up</button>
                    <button className="btn cart-btn" aria-label="View Cart">
                        <FaShoppingCart size={20} />
                        <span className="cart-count">{cartCount}</span>
                    </button>
                </div>
            </nav>

            <header className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                    <h1>
                    WildBites</h1>
                    <h2>
                    CIT-U Food Express</h2>
                      
                      
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
