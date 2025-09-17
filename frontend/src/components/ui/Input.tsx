'use client';

import React, { useState, forwardRef } from 'react';
import { BRAND_CONFIG } from '../../../../shared/constants';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      loading,
      icon,
      helperText,
      onClear,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const { colors, typography } = BRAND_CONFIG;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        {label && (
          <label
            className={`
              block text-sm font-medium mb-1 transition-all duration-200
              ${isFocused ? 'text-primary' : ''}
            `}
            style={{
              color: error ? colors.error : isFocused ? colors.primary : colors.textPrimary,
              fontFamily: typography.fontFamily.primary
            }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-200"
              style={{
                color: isFocused ? colors.primary : colors.textSecondary
              }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-3 py-2 border rounded-lg
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${loading || success || error ? 'pr-10' : ''}
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${success ? 'border-green-500 focus:ring-green-500' : ''}
              ${!error && !success ? 'focus:ring-primary' : ''}
              ${className}
            `}
            style={{
              borderColor: error
                ? colors.error
                : success
                ? colors.success
                : isFocused
                ? colors.primary
                : colors.border,
              fontFamily: typography.fontFamily.primary,
              transform: isFocused ? 'scale(1.01)' : 'scale(1)',
              boxShadow: isFocused ? '0 0 0 3px rgba(255, 90, 95, 0.1)' : 'none'
            }}
            disabled={disabled || loading}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          {/* Status icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {loading && (
              <Loader2
                className="animate-spin"
                size={20}
                style={{ color: colors.primary }}
              />
            )}
            {!loading && success && (
              <CheckCircle
                size={20}
                className="animate-in fade-in duration-300"
                style={{ color: colors.success }}
              />
            )}
            {!loading && error && (
              <XCircle
                size={20}
                className="animate-in fade-in duration-300"
                style={{ color: colors.error }}
              />
            )}
          </div>

          {/* Focus indicator line */}
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r transition-all duration-300"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryDark || colors.primary})`,
              width: isFocused ? '100%' : '0%',
            }}
          />
        </div>

        {/* Helper text or error message */}
        {(error || helperText) && (
          <p
            className={`
              mt-1 text-sm transition-all duration-200
              ${error ? 'animate-in slide-in-from-top-1' : ''}
            `}
            style={{
              color: error ? colors.error : colors.textSecondary,
              fontFamily: typography.fontFamily.primary
            }}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';