import React from 'react';
import { BRAND_CONFIG } from '@/../../shared/constants';

interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  disabled,
  children,
  className = '',
  style = {},
  ...props
}) => {
  const { colors, borderRadius, components } = BRAND_CONFIG;

  // Get size-specific styles
  const sizeStyles = components.button.sizes[size];

  // Get variant-specific styles
  const variantStyles = components.button.variants[variant as keyof typeof components.button.variants];

  // Build base styles
  const baseStyles: React.CSSProperties = {
    ...components.button.base,
    ...sizeStyles,
    borderRadius: borderRadius.button,
    backgroundColor: variantStyles?.background || colors.primary,
    color: variantStyles?.color || colors.textLight,
    border: variantStyles?.border || 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.5 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    ...style,
  };

  const buttonClassName = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-block' : ''} ${className}`.trim();

  return (
    <button
      className={buttonClassName}
      style={baseStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {icon}
          {children}
        </span>
      )}
    </button>
  );
};

// Export convenience components for common button types
export const PrimaryButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="ghost" {...props} />
);

export const DangerButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="danger" {...props} />
);

export const SuccessButton: React.FC<Omit<StyledButtonProps, 'variant'>> = (props) => (
  <StyledButton variant="success" {...props} />
);