import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Homepage from './components/homepage'; 
import Login from './components/login';       
import UserProfile from './components/UserProfile';
import ForgotPassword from './components/forgotpassword';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgotpassword" element={<ForgotPassword/>}/>
                <Route path="/profile" element={<UserProfile />} /> 

            </Routes>
        </Router>
    );
}

export default App;
