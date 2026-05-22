import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { signup, user, error, setError, loading } = useContext(AuthContext);
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

    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await signup(name, email, password);
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 mb-3 bg-brand/20 border border-brand/30 rounded-xl text-brand-light">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-brand-light bg-clip-text text-transparent">
            SmartStore AI
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Create an administrator account for your store
          </p>
        </div>

        {/* Error Banners */}
        {(localError || error) && (
          <div className="mb-4 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Store Owner Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
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
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm glass-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm glass-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand to-brand-light hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-brand/25 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Sign Up
              </>
            )}
          </button>
        </form>

        {/* Navigation link */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-light hover:text-white transition-colors duration-150 font-medium underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
