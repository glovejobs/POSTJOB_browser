'use client';

import { BRAND_CONFIG } from '../../../../shared/constants';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  loading?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  animate?: boolean;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  loading = false,
  onClick,
  variant = 'default',
  animate = true
}: CardProps) {
  const { colors, shadows } = BRAND_CONFIG;

  const baseStyles = `
    rounded-lg transition-all duration-300
    ${animate ? 'transform' : ''}
    ${onClick ? 'cursor-pointer' : ''}
  `;

  const variantStyles = {
    default: {
      backgroundColor: colors.background,
      boxShadow: shadows.sm,
      border: `1px solid ${colors.border}`,
      hover: hoverable ? 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1' : ''
    },
    elevated: {
      backgroundColor: colors.background,
      boxShadow: shadows.md,
      hover: hoverable ? 'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1' : ''
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `2px solid ${colors.border}`,
      hover: hoverable ? `hover:border-${colors.primary} hover:shadow-md` : ''
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`${baseStyles} ${style.hover} ${className} ${loading ? 'animate-pulse' : ''}`}
      style={{
        ...style,
        position: 'relative' as const
      }}
      onClick={onClick}
    >
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-shimmer" />
      )}
      {children}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}