import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/homepage'; // Updated path
import Login from './components/login';       // Updated path


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                
            </Routes>
        </Router>
    );
}

export default App;
