import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css'
import App from './App.jsx'

// Use environment variables with fallbacks to keep existing functionality
const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-a0kbcobmoihg83k6.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'KjbAyRMSUV7i8UtfkTbpU7BtUUceO1wJ';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
    cacheLocation="localstorage"
  >
    <App />
  </Auth0Provider>

  </StrictMode>,
)
