import React, { createContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-500 dark:text-rose-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
    }
  };

  const getToastBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-emerald-500 border-gray-200 dark:border-l-emerald-400 dark:border-dark-700 shadow-emerald-500/5 dark:shadow-emerald-500/10';
      case 'warning':
        return 'border-l-4 border-l-amber-500 border-gray-200 dark:border-l-amber-400 dark:border-dark-700 shadow-amber-500/5 dark:shadow-amber-500/10';
      case 'error':
        return 'border-l-4 border-l-rose-500 border-gray-200 dark:border-l-rose-400 dark:border-dark-700 shadow-rose-500/5 dark:shadow-rose-500/10';
      case 'info':
      default:
        return 'border-l-4 border-l-blue-500 border-gray-200 dark:border-l-blue-400 dark:border-dark-700 shadow-blue-500/5 dark:shadow-blue-500/10';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border bg-white dark:bg-dark-800 shadow-xl flex items-start gap-3 justify-between animate-slide-in transition-all duration-300 ${getToastBorderColor(
              toast.type
            )}`}
            role="alert"
          >
            <div className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5">{getToastIcon(toast.type)}</span>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-normal">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-750 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
