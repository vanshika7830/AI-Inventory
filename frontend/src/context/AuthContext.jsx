import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token header globally
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Session restore failed:', err.response?.data?.message || err.message);
          setAuthToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Signup User
  const signup = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password });
      setUser(res.data);
      setAuthToken(res.data.token);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Login User
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setUser(res.data);
      setAuthToken(res.data.token);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Logout User
  const logout = () => {
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signup,
        login,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
