'use client';

import React from 'react';
import { BRAND_CONFIG } from '../../../../shared/constants';
import { CheckIcon } from '@heroicons/react/24/solid';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = BRAND_CONFIG.colors.primary,
  height = 'md',
  animated = true
}) => {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2">
          {label && (
            <span className="text-sm font-medium" style={{ color: BRAND_CONFIG.colors.textPrimary }}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm" style={{ color: BRAND_CONFIG.colors.textSecondary }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}
        style={{ backgroundColor: BRAND_CONFIG.colors.surface }}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            animated ? 'animate-progress-fill' : ''
          }`}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

interface StepperProps {
  steps: Array<{
    label: string;
    description?: string;
    status: 'completed' | 'active' | 'pending';
  }>;
  orientation?: 'horizontal' | 'vertical';
  showConnector?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  orientation = 'horizontal',
  showConnector = true
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={`flex ${isHorizontal ? 'items-center' : 'flex-col'} ${
        isHorizontal ? 'space-x-4' : 'space-y-4'
      }`}
    >
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`flex ${isHorizontal ? 'flex-col items-center' : 'items-start'}`}>
            <div className="relative">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  transition-all duration-300
                  ${
                    step.status === 'completed'
                      ? 'text-white'
                      : step.status === 'active'
                      ? 'text-white'
                      : 'text-gray-500 border-2'
                  }
                `}
                style={{
                  backgroundColor:
                    step.status === 'completed'
                      ? BRAND_CONFIG.colors.success
                      : step.status === 'active'
                      ? BRAND_CONFIG.colors.primary
                      : BRAND_CONFIG.colors.surface,
                  borderColor: step.status === 'pending' ? BRAND_CONFIG.colors.border : undefined
                }}
              >
                {step.status === 'completed' ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {step.status === 'active' && (
                <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                />
              )}
            </div>
            <div className={`mt-2 ${isHorizontal ? 'text-center' : 'ml-4'}`}>
              <p
                className={`text-sm font-medium ${
                  step.status === 'active' ? 'font-semibold' : ''
                }`}
                style={{
                  color:
                    step.status === 'pending'
                      ? BRAND_CONFIG.colors.textMuted
                      : BRAND_CONFIG.colors.textPrimary
                }}
              >
                {step.label}
              </p>
              {step.description && (
                <p
                  className="text-xs mt-1"
                  style={{ color: BRAND_CONFIG.colors.textSecondary }}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
          {showConnector && index < steps.length - 1 && (
            <div
              className={`${
                isHorizontal ? 'flex-1 h-0.5' : 'w-0.5 flex-1 ml-5'
              } transition-all duration-300`}
              style={{
                backgroundColor:
                  steps[index].status === 'completed'
                    ? BRAND_CONFIG.colors.success
                    : BRAND_CONFIG.colors.border
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = BRAND_CONFIG.colors.primary,
  showPercentage = true,
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={BRAND_CONFIG.colors.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span
            className="text-2xl font-bold"
            style={{ color: BRAND_CONFIG.colors.textPrimary }}
          >
            {Math.round(progress)}%
          </span>
        )}
        {label && (
          <span
            className="text-sm mt-1"
            style={{ color: BRAND_CONFIG.colors.textSecondary }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

interface JobPostingProgressProps {
  jobId: string;
  platforms: Array<{
    name: string;
    status: 'pending' | 'posting' | 'success' | 'failed';
    message?: string;
  }>;
  overallProgress: number;
}

export const JobPostingProgress: React.FC<JobPostingProgressProps> = ({
  platforms,
  overallProgress
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return BRAND_CONFIG.colors.success;
      case 'failed':
        return BRAND_CONFIG.colors.error;
      case 'posting':
        return BRAND_CONFIG.colors.warning;
      default:
        return BRAND_CONFIG.colors.lightGray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'failed':
        return '✗';
      case 'posting':
        return '↻';
      default:
        return '○';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CircularProgress
          progress={overallProgress}
          size={150}
          color={BRAND_CONFIG.colors.primary}
          label="Overall Progress"
        />
      </div>

      <div className="space-y-3">
        {platforms.map((platform, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg border"
            style={{
              borderColor: BRAND_CONFIG.colors.border,
              backgroundColor:
                platform.status === 'posting' ? `${BRAND_CONFIG.colors.warning}10` : 'white'
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: getStatusColor(platform.status) }}
              >
                <span className={platform.status === 'posting' ? 'animate-spin' : ''}>
                  {getStatusIcon(platform.status)}
                </span>
              </div>
              <div>
                <p className="font-medium" style={{ color: BRAND_CONFIG.colors.textPrimary }}>
                  {platform.name}
                </p>
                {platform.message && (
                  <p className="text-sm" style={{ color: BRAND_CONFIG.colors.textSecondary }}>
                    {platform.message}
                  </p>
                )}
              </div>
            </div>
            {platform.status === 'posting' && (
              <div className="animate-pulse">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full animate-progress-indeterminate"
                    style={{ backgroundColor: BRAND_CONFIG.colors.warning }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};