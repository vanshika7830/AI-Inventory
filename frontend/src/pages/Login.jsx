import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [localError, setLocalError] = useState('');
  const { login, user, error, setError, loading } = useContext(AuthContext);
  const navigate = useNavigate();


  useEffect(() => {
    // Clear errors when mounting
    setError(null);
    setLocalError('');
    // If already logged in, redirect
    if (user) {
      navigate('/');
    }
  }, [user, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in AuthContext and displayed below
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-900">
      {/* Decorative Glow Spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full glow-spot-purple opacity-40 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full glow-spot-blue opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md p-8 mx-4 z-10 rounded-2xl glass-panel shadow-2xl relative">
        {/* Logo/Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-3 bg-brand/20 border border-brand/30 rounded-xl text-brand-light">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-brand-light bg-clip-text text-transparent">
            SmartStore AI
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to manage your premium retail store
          </p>
        </div>

        {/* Error Banners */}
        {(localError || error) && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 animate-pulse-slow">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@smartstore.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm glass-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand to-brand-light hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-brand/25 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Navigation link */}
        <div className="mt-8 text-center text-sm text-gray-400">
          New to SmartStore?{' '}
          <Link
            to="/signup"
            className="text-brand-light hover:text-white transition-colors duration-150 font-medium underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
