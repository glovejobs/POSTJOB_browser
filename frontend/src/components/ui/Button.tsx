'use client';

import React from 'react';
import { BRAND_CONFIG } from '../../../../shared/constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  loading = false,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  disabled,
  fullWidth = false,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const { colors, typography, shadows } = BRAND_CONFIG;

  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200
    transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  };

  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark || colors.primary} 100%)`,
      color: 'white',
      boxShadow: shadows.sm,
      hover: 'hover:shadow-md hover:scale-[1.02]'
    },
    secondary: {
      background: colors.background,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      hover: 'hover:bg-gray-50 hover:shadow-sm'
    },
    ghost: {
      background: 'transparent',
      color: colors.textSecondary,
      hover: 'hover:bg-gray-50'
    },
    danger: {
      background: colors.error || '#ef4444',
      color: 'white',
      hover: 'hover:opacity-90'
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }

    // Add ripple effect
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    onClick?.(e);
  };

  const style = variantStyles[variant];

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${style.hover}
        ${className}
        overflow-hidden
      `}
      style={{
        ...style,
        fontFamily: typography.fontFamily.primary,
        position: 'relative' as const,
        ...(loading && { cursor: 'wait' })
      }}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Button content */}
      <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>

      <style jsx>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple-animation 600ms ease-out;
        }

        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}