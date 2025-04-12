import React, { useState, useEffect, createContext, useContext } from 'react';

// Create context for toast notifications
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info'
};

// Provider component that wraps app and provides toast context
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Show a new toast
  const showToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now().toString();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  // Remove a toast by ID
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Convenience methods
  const showSuccess = (message, duration) => showToast(message, TOAST_TYPES.SUCCESS, duration);
  const showError = (message, duration) => showToast(message, TOAST_TYPES.ERROR, duration);
  const showInfo = (message, duration) => showToast(message, TOAST_TYPES.INFO, duration);

  const contextValue = {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Container for displaying all toasts
const ToastContainer = () => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 max-w-md">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Individual toast component
const Toast = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation delay for entrance
    const timeout = setTimeout(() => {
      setVisible(true);
    }, 10);

    return () => clearTimeout(timeout);
  }, []);

  // Determine classes based on toast type
  const baseClasses = "p-4 rounded-lg shadow-lg transition-all duration-300 transform flex items-start gap-3";
  const typeClasses = {
    [TOAST_TYPES.SUCCESS]: "bg-green-50 text-green-800 border-l-4 border-green-500",
    [TOAST_TYPES.ERROR]: "bg-red-50 text-red-800 border-l-4 border-red-500",
    [TOAST_TYPES.INFO]: "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
  };
  const visibilityClasses = visible 
    ? "translate-x-0 opacity-100" 
    : "translate-x-full opacity-0";

  // Icon based on toast type
  const ToastIcon = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case TOAST_TYPES.ERROR:
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        );
    }
  };

  return (
    <div className={`${baseClasses} ${typeClasses[toast.type]} ${visibilityClasses}`}>
      <div className="flex-shrink-0">
        <ToastIcon />
      </div>
      <div className="flex-grow pr-3">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
    </div>
  );
};

export default ToastContainer; 