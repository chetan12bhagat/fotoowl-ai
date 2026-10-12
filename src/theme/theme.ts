import { darkColors, lightColors } from './colors';
import { AppTheme, ThemeBorderRadius, ThemeSpacing, ThemeTypography } from './types';

const typography: ThemeTypography = {
  fontFamily: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

const borderRadius: ThemeBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  isDark: true,
};

export const lightTheme: AppTheme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  isDark: false,
};
