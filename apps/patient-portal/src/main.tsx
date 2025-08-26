import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import TestApp from './TestApp';

console.log('Patient Portal: Starting to render...');
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

try {
  const root = document.getElementById('root');
  console.log('Root element:', root);
  
  if (!root) {
    throw new Error('Root element not found');
  }
  
  const reactRoot = ReactDOM.createRoot(root);
  console.log('React root created');
  
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Patient Portal: Render initiated');
} catch (error) {
  console.error('Patient Portal: Failed to render', error);
  const errorDiv = document.createElement('div');
  errorDiv.style.padding = '20px';
  errorDiv.style.color = 'red';
  errorDiv.textContent = `Error: ${error}`;
  document.body.appendChild(errorDiv);
}
