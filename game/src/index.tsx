import React from 'react';
import ReactDOM from 'react-dom/client'; // Updated import
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!); 
root.render( // Use the new render method
  <React.StrictMode>
    <App />
  </React.StrictMode>
);