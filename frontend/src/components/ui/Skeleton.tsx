'use client';

import React from 'react';
import { BRAND_CONFIG } from '../../../../shared/constants';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '120px'),
    backgroundColor: BRAND_CONFIG.colors.surface,
    background: animation === 'wave'
      ? `linear-gradient(90deg, ${BRAND_CONFIG.colors.surface} 0%, ${BRAND_CONFIG.colors.border} 50%, ${BRAND_CONFIG.colors.surface} 100%)`
      : undefined
  };

  return (
    <div
      className={`${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<{ showAvatar?: boolean }> = ({ showAvatar = false }) => {
  return (
    <div className="p-6 bg-white rounded-lg border" style={{ borderColor: BRAND_CONFIG.colors.border }}>
      {showAvatar && (
        <div className="flex items-center mb-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="ml-4 flex-1">
            <Skeleton width="40%" height={20} className="mb-2" />
            <Skeleton width="60%" height={16} />
          </div>
        </div>
      )}
      <Skeleton className="mb-3" height={24} width="70%" />
      <Skeleton className="mb-2" />
      <Skeleton className="mb-2" />
      <Skeleton width="80%" />
      <div className="mt-4 flex gap-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="w-full">
      <div className="border rounded-lg" style={{ borderColor: BRAND_CONFIG.colors.border }}>
        <div className="p-4 border-b" style={{ borderColor: BRAND_CONFIG.colors.border }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} height={20} />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="p-4 border-b last:border-b-0"
            style={{ borderColor: BRAND_CONFIG.colors.border }}
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height={16} width={colIndex === 0 ? '100%' : '80%'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton width="30%" height={16} className="mb-2" />
          <Skeleton variant="rounded" height={40} />
        </div>
      ))}
      <div className="flex gap-3 mt-8">
        <Skeleton variant="rounded" width={120} height={40} />
        <Skeleton variant="rounded" width={120} height={40} />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="60%" height={20} className="mb-2" />
            <Skeleton width="100%" height={16} className="mb-1" />
            <Skeleton width="80%" height={16} />
          </div>
        </div>
      ))}
    </div>
  );
};