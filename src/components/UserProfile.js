import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SPLoader from './spinnerloader';
import cat from '../assets/cat.svg';
import { FaShoppingCart } from 'react-icons/fa';
import './UserProfile.css';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = 0;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.error('No such document!');
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <SPLoader />;
  }

  const handleOrderClick = () => {
    console.log("Order button clicked");
  };

  const handleLogoutClick = () => {
    auth.signOut(); // Sign out logic
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="navbar-logo">
          <a href="/"><img src={cat} className="App-logo" alt="WildBites Logo" /></a>
        </div>
        <div className="navbar-actions">
          <div className="user-profile">
            <img src={userData?.profilePic || 'defaultPic.png'} alt="Profile" className="profile-pic" />
            <span className="user-name">{userData?.name}</span>
          </div>
          <button className="btn logout-btn" onClick={handleLogoutClick}>Log Out</button>
          <button className="btn cart-btn" aria-label="View Cart">
            <FaShoppingCart size={20} />
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </nav>

      <div className="menu-container">
        <button className="menu-btn" onClick={() => navigate('/menu')}>Menu</button>
        <button className="menu-btn" onClick={() => navigate('/my-orders')}>My Orders</button>
        <button className="menu-btn" onClick={() => navigate('/reports')}>Reports</button>
        <button className="menu-btn" onClick={() => navigate('/user-roles')}>User Roles</button>
        <button className="menu-btn" onClick={() => navigate('/staff-on-duty')}>Staff on Duty</button>
      </div>

      <div className="profile-container">
        {userData ? (
          <div className="user-info">
            <h2>Welcome, {userData.name}!</h2>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Course/Year:</strong> {userData.course}</p>
            <p><strong>Address:</strong> {userData.address}</p>
            <p><strong>Contact Number:</strong> {userData.contactNumber}</p>
          </div>
        ) : (
          <p>No user data available.</p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
