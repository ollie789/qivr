import React from 'react';

function AppSimple() {
  console.log('AppSimple rendering');
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Qivr Clinic Dashboard</h1>
      <p>React is working!</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
}

export default AppSimple;
