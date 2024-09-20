import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigating between pages
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User is logged in:", user.uid);
        const userRef = doc(db, 'users', user.uid); // Get the user's document from Firestore
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data()); // Set the user data in the state
        } else {
          console.error('No such document!');
        }
      } else {
        console.log("User not logged in, redirecting...");
        navigate('/login'); // If not logged in, redirect to login page
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up subscription on component unmount
  }, [navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
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
  );
}

export default UserProfile;
