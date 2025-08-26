import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h2>Home Page</h2>
      <p>React Router is working!</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <h2>About Page</h2>
      <p>You navigated successfully!</p>
    </div>
  );
}

function AppWithRouter() {
  console.log('AppWithRouter rendering');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Qivr Clinic Dashboard - Router Test</h1>
      <Router>
        <nav>
          <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
          <Link to="/about">About</Link>
        </nav>
        <hr />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default AppWithRouter;
