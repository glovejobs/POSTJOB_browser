import React from 'react';
import { BRAND_CONFIG } from '@/../../shared/constants';

interface StyledCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'compact' | 'normal' | 'comfortable' | 'spacious';
  hoverable?: boolean;
  clickable?: boolean;
  bordered?: boolean;
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const StyledCard: React.FC<StyledCardProps> = ({
  padding = 'normal',
  hoverable = false,
  clickable = false,
  bordered = true,
  shadow = 'sm',
  children,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const { colors, borderRadius, components, shadows } = BRAND_CONFIG;

  // Padding mapping
  const paddingMap = {
    compact: '0.75rem',
    normal: '1rem',
    comfortable: '1.5rem',
    spacious: '2rem',
  };

  const cardStyles: React.CSSProperties = {
    ...components.card.base,
    padding: paddingMap[padding],
    borderRadius: borderRadius.card,
    border: bordered ? components.card.base.border : 'none',
    boxShadow: shadow !== 'none' ? shadows[shadow] : 'none',
    cursor: clickable ? 'pointer' : 'default',
    transition: hoverable || clickable ? 'all 250ms ease-in-out' : 'none',
    ...style,
  };

  const cardClassName = `card ${padding !== 'normal' ? `card-${padding}` : ''} ${className}`.trim();

  const handleClick = clickable && onClick ? onClick : undefined;

  return (
    <div
      className={cardClassName}
      style={cardStyles}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (hoverable || clickable) {
          e.currentTarget.style.boxShadow = shadows.md;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || clickable) {
          e.currentTarget.style.boxShadow = shadow !== 'none' ? shadows[shadow] : 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header Component
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  style = {},
  ...props
}) => {
  const { colors } = BRAND_CONFIG;

  return (
    <div
      className={`card-header ${className}`}
      style={{
        padding: '1rem',
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: '1rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Body Component
export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  style = {},
  ...props
}) => {
  const { colors } = BRAND_CONFIG;

  return (
    <div
      className={`card-footer ${className}`}
      style={{
        padding: '1rem',
        borderTop: `1px solid ${colors.border}`,
        marginTop: '1rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};