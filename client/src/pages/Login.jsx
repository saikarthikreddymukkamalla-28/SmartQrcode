import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Fingerprint } from 'lucide-react';

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center py-xl sm:px-lg lg:px-xl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* Branding Logo */}
        <div className="p-sm bg-brand-900 text-white rounded-xl mb-md">
          <Fingerprint size={28} />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-brand-900">
          Sign in to Qube
        </h2>
        <p className="mt-xs text-center text-sm text-brand-500">
          Or{' '}
          <Link to="/register" className="font-medium text-brand-900 hover:underline">
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-lg sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-xl px-xl border border-brand-200 shadow-premium rounded-xl">
          {error && (
            <div className="mb-md p-sm bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <form className="space-y-md" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-xs">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-premium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-xs">
                <label htmlFor="password" className="block text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-premium"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-md border-t border-brand-100 pt-md text-center">
            <p className="text-[11px] text-brand-400">
              Running locally? Just enter any email & password to test in development bypass mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
