import { useAuth0 } from '@auth0/auth0-react';
import { LogIn, UserPlus, Shield } from 'lucide-react';


export default function AuthPage() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: '/' }
    });
  };

  const handleSignup = () => {
    loginWithRedirect({
      appState: { returnTo: '/' },
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            Discover Local
          </h1>
          <p className="text-gray-600">
            Sign in to explore and support local businesses
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Get Started
          </h2>

          <div className="space-y-4">
            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-green-700 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Loading...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-green-700 text-green-700 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              {isLoading ? 'Loading...' : 'Create Account'}
            </button>
          </div>

          {/* Features List */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Why join us?</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-700">✓</span>
                Discover amazing local businesses
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-700">✓</span>
                Leave reviews and ratings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-700">✓</span>
                Get AI-powered recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-700">✓</span>
                Support your local community
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Secured by Auth0 • By continuing, you agree to our{' '}
          <a href="#" className="text-green-700 hover:text-green-600">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-green-700 hover:text-green-600">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
