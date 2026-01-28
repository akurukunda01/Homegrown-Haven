import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from './page.jsx'
import AuthPage from './components/auth.jsx'
import { Auth0Provider } from '@auth0/auth0-react';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [currentUser, setCurrentUser] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !currentUser) {
      syncUser();
    }
  }, [isAuthenticated, user]);

  const syncUser = async () => {
    setSyncLoading(true);
    try {
      const response = await fetch('http://localhost:8000/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      const data = await response.json();
      setCurrentUser(data.user);
      console.log('User synced:', data.user);
    } catch (error) {
      console.error('Error syncing user:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  // Show loading while Auth0 initializes or syncing user
  if (isLoading || (isAuthenticated && syncLoading)) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Pass currentUser (from your DB) not user (from Auth0)
  return <Home currentUser={currentUser} />;
}

export default App;