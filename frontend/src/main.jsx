import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import all existing StayFinder styles
import './styles/global.css';
import './styles/nav.css';
import './styles/auth.css';
import './styles/index.css';
import './styles/search.css';
import './styles/property.css';
import './styles/host.css';
import './styles/admin.css';
import './styles/chat.css';
import './styles/trips.css';
import './styles/verify-email.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
