import React, { useState } from 'react';
import './login.css'; // Make sure to create this CSS file for styling

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login or signup logic here
    console.log(isLogin ? 'Logging in...' : 'Signing up...', { email, password });
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </div>
        <button type="submit" className="btn submit-btn">
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>
      <p>
        {isLogin ? 'Don’t have an account?' : 'Already have an account?'}{' '}
        <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </div>
  );
}

export default Auth;
