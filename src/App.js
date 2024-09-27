import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import Homepage from "./components/homepage";
import Login from "./components/login";
import Signup from "./components/signup";
import ForgotPassword from "./components/forgotpassword";
import OnlineClient from "./components/onlineclient";
import Admin from "./components/Admin";

function App() {
  const location = useLocation(); // useLocation hook needs to be inside a Router

  return (
    <AnimatePresence mode="wait"> 
      {/* AnimatePresence wraps your Routes to enable page transitions */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/onlineclient" element={<OnlineClient/>}/>
        <Route path="/admin" element={<Admin/>}/>
      </Routes>
    </AnimatePresence>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;