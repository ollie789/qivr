import React from 'react';
import ReactDOM from 'react-dom/client';
import { Widget } from './Widget';
import { WidgetV2 } from './WidgetV2';
import './index.css';

// Check if we should use the new widget via URL params or default to v2
const urlParams = new URLSearchParams(window.location.search);
const useV1 = urlParams.get('version') === 'v1';

const App = () => {
  // Default to the new improved widget (V2)
  const WidgetComponent = useV1 ? Widget : WidgetV2;
  
  return <WidgetComponent />;
};

ReactDOM.createRoot(document.getElementById('qivr-widget-root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
