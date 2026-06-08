// ============================================
// DIGITAL COFFEE — Brand Color Design Tokens
// Espresso × Cream × Caramel × Gold Palette
// ============================================

export const colors = {
  // ── Primary Brand: Espresso ──
  espresso: {
    DEFAULT: '#2C1A0E',   // Deep espresso — primary brand color
    mid:     '#4A2E1A',   // CTA buttons, hover
    light:   '#6B4226',   // Lighter espresso for text
    faint:   'rgba(44, 26, 14, 0.06)',
    glow:    'rgba(44, 26, 14, 0.12)',
    foreground: '#FFFFFF',
  },

  // ── Accent: Caramel ──
  caramel: {
    DEFAULT: '#C8853E',   // Warm caramel accent
    light:   '#E8A86A',   // Light caramel hover
    dark:    '#A0692A',   // Dark caramel
    faint:   'rgba(200, 133, 62, 0.10)',
    glow:    'rgba(200, 133, 62, 0.20)',
    foreground: '#FFFFFF',
  },

  // ── Gold: Premium highlights ──
  gold: {
    DEFAULT: '#B8933A',
    light:   '#D4AE5C',
  },

  // ── Background: Cream ──
  cream: {
    DEFAULT: '#FAF6F0',   // Page background
    dark:    '#F0E8DB',   // Section alternate
    deeper:  '#E5D9CA',   // Hover states
    border:  '#E2D4C4',   // Borders, dividers
  },

  // ── Dark: Footer & dark sections ──
  dark: {
    DEFAULT: '#1A0E08',
    mid:     '#231711',
    surface: '#2D1E16',
  },

  // ── Neutrals ──
  neutral: {
    50:  '#FAF6F0',
    100: '#F0E8DB',
    200: '#E5D9CA',
    300: '#D4C4B0',
    400: '#B8A090',
    500: '#9B8070',
    600: '#7A6050',
    700: '#6B4C35',
    800: '#4A2E1A',
    900: '#2C1A0E',
  },

  // ── Status ──
  success: {
    DEFAULT: '#16A34A',
    light:   '#dcfce7',
    foreground: '#FFFFFF',
  },
  warning: {
    DEFAULT: '#D97706',
    light:   '#fef3c7',
    foreground: '#FFFFFF',
  },
  danger: {
    DEFAULT: '#DC2626',
    light:   '#fee2e2',
    foreground: '#FFFFFF',
  },
  info: {
    DEFAULT: '#2563EB',
    light:   '#dbeafe',
    foreground: '#FFFFFF',
  },

  // ── Legacy aliases (backward compat with existing components) ──
  primary: {
    DEFAULT: '#2C1A0E',
    hover:   '#4A2E1A',
    light:   'rgba(44, 26, 14, 0.06)',
    glow:    'rgba(44, 26, 14, 0.12)',
    foreground: '#FFFFFF',
  },
  accent: {
    DEFAULT: '#C8853E',
    light:   '#E8A86A',
    dark:    '#A0692A',
    foreground: '#FFFFFF',
  },
};

export default colors;
