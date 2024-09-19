import React from 'react';
import logo from '../logo.svg';
import logo2 from '../assets/logo.png';
import './homepage.css';

function Homepage(){
    return(
        <div className="homepage">
            <header className="header">
                <img src={logo2} className="logo2" alt="logo2" />
                <h1 className="site-title">WildBites Food Express</h1>
                <h2 className="site-subtitle">CIT-UNIVERSITY</h2>
                
                <nav className="auth-buttons">
                    <button className="login-button">LOG IN</button>
                    <button className="signup-button">SIGN UP</button>
                </nav>
            </header>
            <main className="main-content">
                <div className="content">
                    <h1 className="main-title">WildBites Food</h1>
                    <h2 className='main-title2'>Express</h2>
                    <p className="tagline">Fast. Fresh. Fierce.</p>
                    <button className="order-button">Order Food</button>
                </div>

                <div className="wildcat-image">
                    <img src={logo} className="App-logo" alt="Wildcat Chef" />
                </div>
            </main>
            <footer>
                <hr></hr>
                <p>&copy; {new Date().getFullYear()} WildBites Food Express </p>
            </footer>

        </div>
    );
}

export default Homepage;