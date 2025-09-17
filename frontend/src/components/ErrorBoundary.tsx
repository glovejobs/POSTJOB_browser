'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BRAND_CONFIG } from '../../../shared/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div
            className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center"
            style={{ boxShadow: BRAND_CONFIG.shadows.xl }}
          >
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_CONFIG.colors.error}15` }}
            >
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke={BRAND_CONFIG.colors.error}
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: BRAND_CONFIG.colors.textPrimary }}
            >
              Oops! Something went wrong
            </h1>

            <p
              className="text-sm mb-6"
              style={{ color: BRAND_CONFIG.colors.textSecondary }}
            >
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6">
                <summary
                  className="cursor-pointer text-sm font-medium mb-2"
                  style={{ color: BRAND_CONFIG.colors.error }}
                >
                  Error Details (Development Only)
                </summary>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg"
                style={{
                  backgroundColor: BRAND_CONFIG.colors.primary,
                  hover: { backgroundColor: BRAND_CONFIG.colors.primaryDark }
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 rounded-lg font-medium border transition-all"
                style={{
                  borderColor: BRAND_CONFIG.colors.border,
                  color: BRAND_CONFIG.colors.textSecondary
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { captureError, resetError };
}

// Async error boundary for handling promise rejections
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  fallback
}) => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
  }, []);

  if (error) {
    if (fallback) {
      return <>{fallback(error, reset)}</>;
    }

    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">An error occurred:</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={reset}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return <>{children}</>;
};