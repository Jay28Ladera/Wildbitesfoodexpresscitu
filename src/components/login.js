import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputMask from 'react-input-mask'; // Import InputMask
import './login.css'; // Ensure this file contains styling for the form
import loghead from '../assets/loginhead.svg'; // Corrected the variable name
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../firebase/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import signInWithGoogle from './signInWithGoogle';



function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Additional state for Sign Up fields
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [schoolIDNumber, setSchoolIDNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 
  
  const handleForgotPasswordClick = () => {
    navigate('/forgotpassword')
    };

  // Validation state
  const [schoolIDValid, setSchoolIDValid] = useState(true);
  const [contactNumberValid, setContactNumberValid] = useState(true);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate School ID Number
    const schoolIDRegex = /^\d{2}-\d{4}-\d{3}$/;
    if (!schoolIDRegex.test(schoolIDNumber)) {
      setError('School ID Number must be in the format ##-####-###.');
      setSchoolIDValid(false);
      return;
    } else {
      setSchoolIDValid(true);
    }

    // Validate Contact Number
    const contactNumberRegex = /^\+63\s\d{10}$/;
    if (!contactNumberRegex.test(contactNumber)) {
      setError('Contact Number must be in the format +63 ##########.');
      setContactNumberValid(false);
      return;
    } else {
      setContactNumberValid(true);
    }

    // Validate Passwords Match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        course,
        schoolIDNumber,
        contactNumber,
        email: user.email,
        uid: user.uid,
      });

      console.log('User registered and profile stored:', user.uid);
      // Navigate to profile or another desired page after registration
      navigate('/profile'); // or navigate('/login');
    } catch (error) {
      // Map Firebase errors to user-friendly messages
      let errorMessage = '';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. It should be at least 6 characters.';
          break;
        default:
          errorMessage = 'Registration failed. Please try again.';
      }
      setError(errorMessage);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log("Attempting to log in...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential);
      navigate('/profile'); // Redirect to profile page on successful login
    } catch (error) {
      // Map Firebase errors to user-friendly messages
      let errorMessage = '';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        default:
          errorMessage = 'Login failed. Please try again.';
      }
      setError(errorMessage);
      console.error("Login error:", errorMessage);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        console.log("User is logged in:", user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.error('No such document!');
        }
      } else {
        console.log("User not logged in, redirecting...");
        // Avoid redirecting if the user is already on the login/signup page
        // Assuming this component is used on the login/signup route
        if (!isLogin) {
          navigate('/login');
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [navigate, isLogin]);

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
    setSchoolIDNumber('');
    setContactNumber('');
    setConfirmPassword('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>; // Add a loading indicator
  }

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
              <label htmlFor="schoolIDNumber">School ID Number:</label>
              <InputMask
                mask="99-9999-999"
                maskChar=""
                id="schoolIDNumber"
                value={schoolIDNumber}
                onChange={(e) => setSchoolIDNumber(e.target.value)}
                required={!isLogin}
                placeholder="12-3456-789"
              >
                {(inputProps) => (
                  <input
                    {...inputProps}
                    type="text"
                    className={`input ${!schoolIDValid ? 'invalid' : ''}`}
                  />
                )}
              </InputMask>
              {!schoolIDValid && <span className="error-text">Invalid School ID Number format.</span>}
            </div>
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number:</label>
              <InputMask
                mask="+63 9999999999"
                maskChar=""
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required={!isLogin}
                placeholder="+63 9123456789"
              >
                {(inputProps) => (
                  <input
                    {...inputProps}
                    type="tel"
                    className={`input ${!contactNumberValid ? 'invalid' : ''}`}
                  />
                )}
              </InputMask>
              {!contactNumberValid && <span className="error-text">Invalid Contact Number format.</span>}
            </div>
          </>
        )}
        <div className="form-group">
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
      <p className="continue-p">-- Or continue with --</p>

      <button onClick={signInWithGoogle} className="btn google-signin-btn">
        <img src={require("../assets/google.png")} alt="Sign in with Google" width="60%" />
      </button>

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
