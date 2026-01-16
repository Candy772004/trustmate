import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { isSupabaseConfigured } from './lib/supabaseClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (!isSupabaseConfigured) {
  root.render(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Configuration Required</h1>
      <p style={{ maxWidth: '600px', lineHeight: '1.5' }}>
        Supabase URL and Anon Key are missing.
        <br />
        If you are running locally, check your <code>.env.local</code> file.
        <br />
        If you are on Netlify, please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your Site Settings &gt; Environment Variables.
      </p>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}