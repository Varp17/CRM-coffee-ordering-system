export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem',     // 48px
};

export const radius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'monospace',
  },
  sizes: {
    xs: 'clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem)',
    sm: 'clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem)',
    base: 'clamp(0.9rem, 0.85rem + 0.25vw, 1.05rem)',
    lg: 'clamp(1.05rem, 0.95rem + 0.35vw, 1.25rem)',
    xl: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)',
    xxl: 'clamp(1.5rem, 1.3rem + 0.8vw, 2.2rem)',
    hero: 'clamp(2rem, 1.6rem + 1.6vw, 3.5rem)',
  }
};
