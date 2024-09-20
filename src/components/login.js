import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css'; // Ensure this file contains styling for the form
import loghead from './loginhead.svg'; // Corrected the variable name
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions


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

  
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        course,
        address,
        contactNumber,
        email: user.email,
        uid: user.uid,
      });

      console.log('User registered and profile stored:', user.uid);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      navigate('/profile'); // Redirect to profile page on successful login
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      handleLogin(e);
    } else {
      handleRegister(e);
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
      <header className="auth-header">
        <img src={loghead} className="loghead" alt="logheader" />
        <p>{isLogin ? 'Log In to your account' : 'Create a new account'}</p>
      </header>

      <form onSubmit={handleSubmit} className="auth-form">
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
        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn submit-btn">
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <p>
        {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="btn toggle-btn">
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </div>
  );
}

export default Auth;
