import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AITools from './pages/AITools';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Loading Screen Component
const FullScreenLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100">
    <div className="relative flex items-center justify-center mb-4">
      <div className="h-16 w-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
      <div className="absolute h-8 w-8 border-4 border-brand-light/10 border-b-brand-light rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
    </div>
    <p className="text-sm font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase animate-pulse">
      Securing Connection...
    </p>
  </div>
);

// Protected Layout wrapper
const AppLayout = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <FullScreenLoader />;
  }

  return user ? (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto bg-gray-100/30 dark:bg-dark-900/40 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Route wrapper for guest users (prevents logged in users from seeing login/signup pages)
const GuestRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <FullScreenLoader />;
  }

  return !user ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/ai-tools" element={<AITools />} />
              </Route>

              {/* Catch-all redirects */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
