'use client';

import React from 'react';
import { BRAND_CONFIG } from '../../../../shared/constants';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = BRAND_CONFIG.colors.primary,
  className = '',
  text,
  fullScreen = false,
  overlay = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const loader = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin`}
        style={{
          borderColor: `${color} transparent transparent transparent`,
          borderStyle: 'solid'
        }}
      />
      {text && (
        <p
          className={`mt-4 text-${size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'base'}`}
          style={{ color: BRAND_CONFIG.colors.textSecondary }}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        {loader}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          {loader}
        </div>
      </div>
    );
  }

  return loader;
};

interface ButtonLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  loading,
  children,
  disabled,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: `bg-[${BRAND_CONFIG.colors.primary}] text-white hover:bg-[${BRAND_CONFIG.colors.primaryDark}] focus:ring-[${BRAND_CONFIG.colors.primary}]`,
    secondary: `bg-[${BRAND_CONFIG.colors.secondary}] text-white hover:bg-[${BRAND_CONFIG.colors.secondaryDark}] focus:ring-[${BRAND_CONFIG.colors.secondary}]`,
    outline: `border-2 border-[${BRAND_CONFIG.colors.primary}] text-[${BRAND_CONFIG.colors.primary}] hover:bg-[${BRAND_CONFIG.colors.primary}] hover:text-white`,
    ghost: `text-[${BRAND_CONFIG.colors.textPrimary}] hover:bg-[${BRAND_CONFIG.colors.surface}]`
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        backgroundColor: variant === 'primary' ? BRAND_CONFIG.colors.primary :
                        variant === 'secondary' ? BRAND_CONFIG.colors.secondary :
                        undefined
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader size="sm" color={variant === 'outline' ? BRAND_CONFIG.colors.primary : '#FFFFFF'} />
        </div>
      )}
      <span className={loading ? 'invisible' : ''}>
        {children}
      </span>
    </button>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return <Loader fullScreen size="lg" text={text} />;
};

export const CardLoader: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      ))}
    </div>
  );
};