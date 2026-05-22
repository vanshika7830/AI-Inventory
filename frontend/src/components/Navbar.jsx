import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import {
  Bell,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  Trash2,
  Check,
  X,
  Sun,
  Moon
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Get dynamic header based on route
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Store Dashboard';
      case '/products':
        return 'Product Catalog';
      case '/ai-tools':
        return 'AI Copywriter';
      default:
        return 'SmartStore AI';
    }
  };

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete('/api/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    } finally {
      setShowClearConfirm(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    window.addEventListener('notification-added', fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-added', fetchNotifications);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowClearConfirm(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 glass-panel sticky top-0 z-20">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
          {getHeaderTitle()}
        </h2>
      </div>

      {/* Action panel */}
      <div className="flex items-center gap-4 md:gap-6" ref={dropdownRef}>
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-700/30 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 transition-colors duration-200">
          <Calendar className="h-3.5 w-3.5 text-brand-light" />
          <span>{getFormattedDate()}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700/50 rounded-full transition-all duration-150 border border-transparent hover:border-gray-200 dark:hover:border-gray-850"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-600" />
          )}
        </button>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700/50 rounded-full transition-all duration-150 border ${
              isOpen
                ? 'border-gray-200 bg-gray-100 text-gray-900 dark:border-gray-850 dark:bg-dark-700/30 dark:text-white'
                : 'border-transparent'
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-rose-600 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center border-2 border-white dark:border-dark-900 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
 
          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-xl dark:shadow-2xl dark:shadow-black/80 z-50 overflow-hidden backdrop-blur-xl animate-fade-in transition-all duration-200">
              {/* Header */}
              <div className="p-4 bg-gray-50/60 dark:bg-black/60 border-b border-gray-200 dark:border-gray-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">System Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-extrabold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={markAllRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                      title="Mark all as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Read
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-xs font-semibold text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 flex items-center gap-0.5 transition-colors"
                      title="Clear all alerts"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All
                    </button>
                  </div>
                )}
              </div>
 
              {/* Confirm Clear Overlay */}
              {showClearConfirm && (
                <div className="p-4 bg-gray-50 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-3 z-10 relative">
                  <p className="text-xs font-bold text-gray-800 dark:text-white">Are you sure you want to delete all alerts?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-dark-750 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={clearAllNotifications}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Yes, Clear
                    </button>
                  </div>
                </div>
              )}
 
              {/* Notification list */}
              <div className="max-h-[24rem] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800/50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-2">
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-white">All caught up!</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">No notifications or recent alerts to display.</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.read && markAsRead(notif._id)}
                      className={`p-4 flex gap-3 text-left transition-colors cursor-pointer relative border-l-4 ${
                        notif.read
                          ? 'hover:bg-gray-100/80 bg-gray-50/20 dark:hover:bg-zinc-900/50 dark:bg-black/40 text-gray-600 dark:text-gray-300 border-transparent'
                          : 'bg-blue-50/60 hover:bg-blue-100/40 dark:bg-blue-950/20 dark:hover:bg-blue-950/35 text-gray-900 dark:text-white border-blue-500'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-xs leading-normal ${notif.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-semibold'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-400 block font-medium">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 bg-blue-500 dark:bg-blue-400 rounded-full shrink-0 self-center"></span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
