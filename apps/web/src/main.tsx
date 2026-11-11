import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 浅色为默认主题（docs/design-v0.1.md：深浅双主题先做浅色）。
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
