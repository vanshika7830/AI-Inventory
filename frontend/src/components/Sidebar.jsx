import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  LogOut,
  User,
  Store
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'AI Copywriter', path: '/ai-tools', icon: Sparkles },
  ];

  return (
    <aside className="w-64 min-h-screen flex flex-col glass-panel border-r border-gray-200 dark:border-gray-800 shrink-0 transition-all duration-200">
      {/* Brand Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-800">
        <div className="p-1.5 bg-brand rounded-lg text-white">
          <Store className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          SmartStore <span className="text-brand-light">AI</span>
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'text-gray-500 hover:text-gray-950 hover:bg-gray-200/40 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700/50'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User Session profile panel */}
      {user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-500/5 dark:bg-dark-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-bold dark:text-brand-light">
              {user.name ? user.name[0].toUpperCase() : <User className="h-5 w-5" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 border border-gray-200 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-500/20 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
