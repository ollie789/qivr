import React from 'react';
import ReactDOM from 'react-dom/client';
import { Widget } from './Widget';

const root = document.getElementById('qivr-widget-root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Widget />
    </React.StrictMode>
  );
}
