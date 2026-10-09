// Ensure React Fast Refresh preamble symbols exist in all environments
if (typeof window !== 'undefined') {
  (window as any).$RefreshReg$ = (window as any).$RefreshReg$ || function () {};
  (window as any).$RefreshSig$ = (window as any).$RefreshSig$ || function () { return function (type: any) { return type; }; };
  (window as any).__vite_plugin_react_preamble_installed__ = true;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
