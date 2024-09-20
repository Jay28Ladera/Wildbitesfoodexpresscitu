import React, { useState } from 'react';
import './login.css'; // Ensure this file contains styling for the form
import loghead from '../assets/loginhead.svg'; // Corrected the variable name
import {useNavigate } from 'react-router-dom';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Additional state for Sign Up fields
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const handleForgotPasswordClick = () => {
    navigate('/forgotpassword')
};
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLogin) {
      // Check if password and confirm password match
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      // Reset error if passwords match
      setError('');
      // Handle sign-up logic here
      console.log('Signing up...', { name, course, address, contactNumber, email, password });
    } else {
      // Handle login logic here
      console.log('Logging in...', { email, password });
    }

    // Reset form fields after submission (optional)
    setEmail('');
    setPassword('');
    setName('');
    setCourse('');
    setAddress('');
    setContactNumber('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-container">
      {/* Header section with the image and description */}
      <header className="auth-header">
        <img src={loghead} className="loghead" alt="logheader" /> {/* Matches the hero tagline from your homepage */}
        <p>{isLogin ? 'Log In to your account' : 'Create a new account'}</p>
      </header>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Show these fields only during Sign Up */}
        {!isLogin && (
          <>
            <div className="form-group">
              <label htmlFor="name">Complete Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="course">Course/Year:</label>
              <input
                type="text"
                id="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required={!isLogin}
                placeholder="e.g., B.Tech / 3rd Year"
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address:</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={!isLogin}
                placeholder="Enter your address"
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number:</label>
              <input
                type="tel"
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required={!isLogin}
                placeholder="e.g., +1234567890"
              />
            </div>
          </>
        )}
        {/* Common fields for both login and sign up */}
        <div className="form-group">
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
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
        {/* Confirm Password Field moved right after Password */}
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!isLogin}
              placeholder="Re-enter your password"
            />
          </div>
        )}
        {/* Display error message if passwords do not match */}
        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn submit-btn">
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <p>
        {isLogin ? (
          <>
            Don’t have an account?{' '}
            <button onClick={() => { setIsLogin(false); setError(''); }} className="btn toggle-btn">
              Sign Up
            </button>
            <br />
            <button onClick ={handleForgotPasswordClick} className="btn toggle-btn">
              Forgot Password?
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button onClick={() => { setIsLogin(true); setError(''); }} className="btn toggle-btn">
              Log In
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default Auth;
