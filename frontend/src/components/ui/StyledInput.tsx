import React from 'react';
import { BRAND_CONFIG } from '@/../../shared/constants';

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const StyledInput: React.FC<StyledInputProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  leftIcon,
  rightIcon,
  className = '',
  style = {},
  ...props
}) => {
  const { colors, borderRadius, components } = BRAND_CONFIG;

  const inputStyles: React.CSSProperties = {
    ...components.input.base,
    borderRadius: borderRadius.input,
    width: fullWidth ? '100%' : 'auto',
    paddingLeft: leftIcon ? '2.5rem' : components.input.base.padding?.split(' ')[1],
    paddingRight: rightIcon ? '2.5rem' : components.input.base.padding?.split(' ')[1],
    borderColor: error ? colors.error : components.input.base.border?.split(' ')[2],
    ...style,
  };

  const inputClassName = `input-field ${error ? 'input-error' : ''} ${className}`.trim();

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: colors.dark }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
            style={{ color: colors.gray }}
          >
            {leftIcon}
          </div>
        )}

        <input
          className={inputClassName}
          style={inputStyles}
          {...props}
        />

        {rightIcon && (
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            style={{ color: colors.gray }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p
          className="text-xs mt-1"
          style={{ color: error ? colors.error : colors.gray }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// Export convenience components for specific input types
export const TextInput: React.FC<StyledInputProps> = (props) => (
  <StyledInput type="text" {...props} />
);

export const EmailInput: React.FC<StyledInputProps> = (props) => (
  <StyledInput type="email" {...props} />
);

export const PasswordInput: React.FC<StyledInputProps> = (props) => (
  <StyledInput type="password" {...props} />
);

export const NumberInput: React.FC<StyledInputProps> = (props) => (
  <StyledInput type="number" {...props} />
);

export const SearchInput: React.FC<StyledInputProps> = (props) => (
  <StyledInput type="search" {...props} />
);