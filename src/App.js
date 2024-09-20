import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/homepage'; // Updated path
import Login from './components/login';       // Updated path
import UserProfile from './components/UserProfile';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<UserProfile />} /> 
            </Routes>
        </Router>
    );
}

export default App;
