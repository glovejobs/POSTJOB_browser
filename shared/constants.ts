// Shared constants

// Central branding configuration - Single source of truth for all UI theming
export const BRAND_CONFIG = {
  name: 'PostJob',
  tagline: 'Automate Your Job Posting Workflow',

  // Airbnb-inspired color palette
  colors: {
    // Primary colors
    primary: '#FF5A5F',      // Rausch - Airbnb's signature coral
    primaryDark: '#E84C51',  // Darker shade for hover states
    primaryLight: '#FF7479', // Lighter shade for backgrounds

    // Secondary colors
    secondary: '#00A699',    // Babu - Teal
    secondaryDark: '#008B7D',
    secondaryLight: '#1AB3A6',

    // Neutral colors
    dark: '#484848',         // Charcoal - Main text
    gray: '#767676',         // Gray - Secondary text
    lightGray: '#B0B0B0',    // Light gray - Disabled states

    // Background colors
    background: '#FFFFFF',   // White - Main background
    surface: '#F7F7F7',      // Light Gray - Card backgrounds
    border: '#EBEBEB',       // Border color

    // Status colors
    success: '#00A699',      // Teal for success
    warning: '#FFB400',      // Yellow for warnings
    error: '#FF5A5F',        // Coral for errors
    info: '#484848',         // Dark gray for info

    // Text colors
    textPrimary: '#484848',
    textSecondary: '#767676',
    textLight: '#FFFFFF',
    textMuted: '#B0B0B0',
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", Monaco, "Inconsolata", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    base: '0 2px 8px rgba(0, 0, 0, 0.15)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.18)',
    xl: '0 12px 48px rgba(0, 0, 0, 0.22)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Helper function to get CSS variables from brand config
export const getCSSVariables = () => {
  const cssVars: Record<string, string> = {};

  // Colors
  Object.entries(BRAND_CONFIG.colors).forEach(([key, value]) => {
    cssVars[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });

  // Spacing
  Object.entries(BRAND_CONFIG.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Border radius
  Object.entries(BRAND_CONFIG.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });

  // Shadows
  Object.entries(BRAND_CONFIG.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  return cssVars;
};

// Export type for TypeScript support
export type BrandConfig = typeof BRAND_CONFIG;

export const JOB_STATUSES = {
  PENDING: 'pending',
  POSTING: 'posting',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const POSTING_STATUSES = {
  PENDING: 'pending',
  POSTING: 'posting',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const;

export const API_ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  INVALID_API_KEY: 'Invalid API key',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  PAYMENT_REQUIRED: 'Payment required',
  INTERNAL_SERVER_ERROR: 'Internal server error'
} as const;

export const STRIPE_CONFIG = {
  PRICE_PER_JOB: 299, // $2.99 in cents
  CURRENCY: 'usd'
} as const;

export const RATE_LIMITS = {
  JOBS_PER_HOUR: 5,
  API_CALLS_PER_MINUTE: 60
} as const;

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  SUBSCRIBE_JOB: 'subscribe-job',
  UNSUBSCRIBE_JOB: 'unsubscribe-job',
  JOB_STATUS: 'job-status',
  JOB_COMPLETE: 'job-complete',
  ERROR: 'error'
} as const;