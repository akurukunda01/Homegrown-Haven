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
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !currentUser) {
      syncUser();
    }
  }, [isAuthenticated, user]);

  const syncUser = async () => {
    setSyncLoading(true);
    setSyncError(false);
    try {
      const response = await fetch('http://localhost:8000/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setCurrentUser(data.user);
        console.log('User synced:', data.user);
        return;
      }

      // Sync failed -- the user may already exist; fall back to a direct lookup.
      console.error('User sync failed, trying fallback:', data);
      const fallback = await fetch(
        `http://localhost:8000/auth/current-user?auth0_id=${encodeURIComponent(user.sub)}`
      );
      if (fallback.ok) {
        const existing = await fallback.json();
        setCurrentUser(existing);
        console.log('Resolved existing user:', existing);
        return;
      }

      console.error('Could not resolve user.');
      setSyncError(true);
    } catch (error) {
      console.error('Error syncing user:', error);
      setSyncError(true);
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

  // Authenticated but the user record couldn't be resolved -- show a retry
  // instead of rendering Home in a broken (no-identity) state.
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          {syncError ? (
            <>
              <p className="text-green-800 font-semibold mb-4">
                We couldn't load your account. Please make sure the server is running.
              </p>
              <button
                onClick={syncUser}
                className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-700 font-semibold">Loading...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Pass currentUser (from your DB) not user (from Auth0).
  return <Home currentUser={currentUser} />;
}

export default App;