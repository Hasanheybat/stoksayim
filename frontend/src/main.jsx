import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './i18n';
import App from './App.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px'
            },
            success: {
              iconTheme: { primary: '#1A5FAD', secondary: '#fff' }
            }
          }}
        />
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
