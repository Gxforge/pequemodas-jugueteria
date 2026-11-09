export const DESIGN_TOKENS = {
  colors: {
    brand: {
      50: '#FFF1F4',
      100: '#FFE0E7',
      200: '#FFC6D4',
      300: '#FF9BB3',
      400: '#F76A8C',
      500: '#E84C6F',
      600: '#D4385B',
      700: '#B22748',
      800: '#94233F',
      900: '#7E2139'
    },
    sky: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1'
    },
    sunny: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706'
    },
    mint: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',
      600: '#059669',
      700: '#047857'
    },
    whatsapp: {
      500: '#25D366',
      600: '#1DA851',
      700: '#15803D'
    },
    surface: {
      cream: '#FFFDF9',
      paper: '#FFFFFF',
      subtle: '#F8FAFC',
      muted: '#F1F5F9'
    },
    ink: {
      primary: '#1E293B',
      secondary: '#475569',
      muted: '#64748B',
      border: '#E2E8F0'
    }
  },
  typography: {
    fontHeading: "'Nunito', 'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
    fontBody: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  },
  radii: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    full: '9999px'
  },
  shadows: {
    card: '0 4px 20px -2px rgba(30, 41, 59, 0.06), 0 2px 6px -1px rgba(30, 41, 59, 0.04)',
    elevated: '0 12px 32px -4px rgba(30, 41, 59, 0.12), 0 4px 12px -2px rgba(30, 41, 59, 0.06)',
    brandGlow: '0 8px 24px -4px rgba(212, 56, 91, 0.28)'
  }
} as const;
