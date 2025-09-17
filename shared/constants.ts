// Shared constants

// Central branding configuration - Single source of truth for all UI theming
export const BRAND_CONFIG = {
  name: 'PostJob',
  tagline: 'Automate Your Job Posting Workflow',

  // Professional minimal color palette
  colors: {
    // Primary colors - Dark slate for professional look
    primary: '#0F172A',      // Slate-900 - Professional dark blue
    primaryDark: '#020617',  // Slate-950 - Darker for hover
    primaryLight: '#1E293B', // Slate-800 - Lighter variant

    // Secondary colors - Subtle blue accent
    secondary: '#3B82F6',    // Blue-500 - Professional accent
    secondaryDark: '#2563EB', // Blue-600 - Darker variant
    secondaryLight: '#60A5FA', // Blue-400 - Lighter variant

    // Neutral colors - Professional grays
    dark: '#0F172A',         // Slate-900 - Main headers
    gray: '#64748B',         // Slate-500 - Body text
    lightGray: '#94A3B8',    // Slate-400 - Muted text

    // Background colors - Clean whites and grays
    background: '#FFFFFF',   // Pure white - Main background
    surface: '#F8FAFC',      // Slate-50 - Card backgrounds
    border: '#E2E8F0',       // Slate-200 - Subtle borders

    // Status colors - Professional status indicators
    success: '#16A34A',      // Green-600 - Success states
    warning: '#D97706',      // Amber-600 - Warning states
    error: '#DC2626',        // Red-600 - Error states
    info: '#0284C7',         // Sky-600 - Info states

    // Text colors - High contrast for readability
    textPrimary: '#0F172A',  // Slate-900 - Primary text
    textSecondary: '#475569', // Slate-600 - Secondary text
    textLight: '#FFFFFF',    // White - Light text
    textMuted: '#94A3B8',    // Slate-400 - Muted text
  },

  // Typography - Smaller, professional sizing
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", "Consolas", Monaco, "Inconsolata", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.625rem',    // 10px - Tiny labels
      sm: '0.75rem',     // 12px - Small text
      base: '0.8125rem', // 13px - Body text
      lg: '0.875rem',    // 14px - Slightly larger
      xl: '1rem',        // 16px - Headers
      '2xl': '1.125rem', // 18px - Section headers
      '3xl': '1.375rem', // 22px - Page titles
      '4xl': '1.75rem',  // 28px - Large headers
      '5xl': '2.25rem',  // 36px - Hero text
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.1,
      snug: 1.3,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
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

  // Border radius - Standardized for all components
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px - Small elements
    base: '0.375rem',// 6px - Default for inputs and small buttons
    md: '0.5rem',    // 8px - Standard buttons and cards
    lg: '0.75rem',   // 12px - Large buttons and modals
    xl: '1rem',      // 16px - Extra large elements
    '2xl': '1.5rem', // 24px - Hero sections
    full: '9999px',  // Pills and circular elements

    // Component-specific (for consistency)
    button: '0.5rem',     // 8px - All buttons
    input: '0.375rem',    // 6px - All inputs
    card: '0.75rem',      // 12px - All cards
    modal: '1rem',        // 16px - All modals
    dropdown: '0.5rem',   // 8px - All dropdowns
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

  // Component Styles - Standardized UI components
  components: {
    button: {
      // Base button styles
      base: {
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        transition: '250ms ease-in-out',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
      },
      // Size variants
      sizes: {
        xs: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
        sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
        md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
        lg: { padding: '0.625rem 1.25rem', fontSize: '1rem' },
        xl: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
      },
      // Style variants
      variants: {
        primary: {
          background: '#0F172A',
          color: '#FFFFFF',
          hover: { background: '#020617' },
        },
        secondary: {
          background: '#3B82F6',
          color: '#FFFFFF',
          hover: { background: '#2563EB' },
        },
        outline: {
          background: 'transparent',
          border: '1px solid #E2E8F0',
          color: '#0F172A',
          hover: { background: '#F8FAFC' },
        },
        ghost: {
          background: 'transparent',
          color: '#64748B',
          hover: { background: '#F8FAFC', color: '#0F172A' },
        },
      },
    },
    input: {
      base: {
        padding: '0.5rem 0.75rem',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        border: '1px solid #E2E8F0',
        transition: '250ms ease-in-out',
        background: '#FFFFFF',
      },
      focus: {
        borderColor: '#3B82F6',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
    },
    card: {
      base: {
        padding: '1rem',
        borderRadius: '0.75rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
      hover: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
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