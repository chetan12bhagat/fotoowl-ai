export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  border: string;
  borderSubtle: string;
  
  // Brand accents (FotoOwl.AI teal/cyan)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: [string, string];
  accent: string; // Electric cyan
  accentAmber: string; // For favorites / stars

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Status & Feedback
  success: string;
  error: string;
  warning: string;
  info: string;

  // Input & Interactive
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  placeholderText: string;
  disabled: string;
  overlay: string;
}

export interface ThemeTypography {
  fontFamily: string;
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    display: number;
  };
  weights: {
    regular: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface AppTheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  isDark: boolean;
}
