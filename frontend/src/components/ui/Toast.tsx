'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X, Loader2 } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../shared/constants';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, update: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds, loading toasts don't auto-remove)
    if (toast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, update: Partial<Toast>) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...update } : t));

    // If updating to a non-loading type, auto-remove after duration
    if (update.type && update.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, update.duration || 3000);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const { colors, typography, shadows } = BRAND_CONFIG;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'loading':
        return <Loader2 size={20} className="animate-spin" />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: '#10b981', text: 'white' };
      case 'error':
        return { bg: colors.error || '#ef4444', text: 'white' };
      case 'info':
        return { bg: colors.primary, text: 'white' };
      case 'warning':
        return { bg: '#f59e0b', text: 'white' };
      case 'loading':
        return { bg: colors.primary, text: 'white' };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-2 pointer-events-none">
      {toasts.map((toast, index) => {
        const typeColors = getColors(toast.type);
        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-4 shadow-lg
              min-w-[300px] max-w-[500px]
              animate-in slide-in-from-top-2 fade-in duration-300
              pointer-events-auto cursor-pointer
              transition-all duration-300 hover:scale-[1.02]
            `}
            style={{
              backgroundColor: typeColors.bg,
              color: typeColors.text,
              fontFamily: typography.fontFamily.primary,
              borderRadius: BRAND_CONFIG.borderRadius.card,
              boxShadow: shadows.lg,
              animationDelay: `${index * 100}ms`
            }}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>

            <div className="flex-1">
              <h4 className="font-medium text-sm">{toast.title}</h4>
              {toast.message && (
                <p className="mt-1 text-xs opacity-90">{toast.message}</p>
              )}
            </div>

            {toast.type !== 'loading' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Helper functions for common toast types
export function showSuccessToast(title: string, message?: string) {
  const { addToast } = useToast();
  return addToast({ type: 'success', title, message });
}

export function showErrorToast(title: string, message?: string) {
  const { addToast } = useToast();
  return addToast({ type: 'error', title, message });
}

export function showLoadingToast(title: string, message?: string) {
  const { addToast } = useToast();
  return addToast({ type: 'loading', title, message });
}