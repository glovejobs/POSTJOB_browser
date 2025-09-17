/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Touch device specific
        'touch': { 'raw': '(hover: none)' },
        'hover-hover': { 'raw': '(hover: hover)' },
        // Orientation specific
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
      },
      spacing: {
        // Mobile-friendly tap target sizes (minimum 44x44px for iOS, 48x48px for Android)
        'tap': '44px',
        'tap-android': '48px',
      },
      fontSize: {
        // Mobile-optimized font sizes
        'xs-mobile': ['0.75rem', { lineHeight: '1.5' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.5' }],
        'base-mobile': ['1rem', { lineHeight: '1.5' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.5' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.4' }],
        '2xl-mobile': ['1.5rem', { lineHeight: '1.3' }],
      },
      animation: {
        // Touch-friendly animations
        'tap': 'tap 0.2s ease-in-out',
        'swipe-left': 'swipe-left 0.3s ease-out',
        'swipe-right': 'swipe-right 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        tap: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        },
        'swipe-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'swipe-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin for mobile utilities
    function({ addUtilities }) {
      const newUtilities = {
        // Safe area insets for notched devices
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        // Touch action utilities
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        '.touch-none': {
          touchAction: 'none',
        },
        '.touch-pan-x': {
          touchAction: 'pan-x',
        },
        '.touch-pan-y': {
          touchAction: 'pan-y',
        },
        // Smooth scrolling
        '.scroll-smooth-touch': {
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth',
        },
        // Prevent text selection
        '.select-none-touch': {
          '-webkit-touch-callout': 'none',
          '-webkit-user-select': 'none',
          'user-select': 'none',
        },
        // Tap highlight
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        // Momentum scrolling
        '.overflow-scrolling-touch': {
          '-webkit-overflow-scrolling': 'touch',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};