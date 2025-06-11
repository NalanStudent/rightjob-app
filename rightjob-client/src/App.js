import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Home";
import About from "./About";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="page-wrapper">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="navbar-left">
            <img src="/rightjob-logo.png" alt="Logo" className="navbar-logo" />
          </div>
          <div className="navbar-right">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );

  
}
