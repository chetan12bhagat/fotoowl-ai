import { ThemeColors } from './types';

export const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#071421', // Primary deep navy foundation
  surface: '#0B1C2A', // Secondary dark navy
  surfaceElevated: '#112538',
  card: '#0D1F31',
  border: '#1C2F45',
  borderSubtle: '#132337',

  // FotoOwl.AI Warm Golden Yellow branding
  primary: '#FFB900', // Warm golden yellow
  primaryLight: '#FFC837',
  primaryDark: '#E5A600',
  primaryGradient: ['#FFB900', '#F59E0B'],
  accent: '#FFB900',
  accentAmber: '#FFB900',

  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#071421',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#38BDF8',

  inputBackground: '#0B1C2A',
  inputBorder: '#1C2F45',
  inputBorderFocused: '#FFB900',
  placeholderText: '#64748B',
  disabled: '#1E293B',
  overlay: 'rgba(7, 20, 33, 0.85)',
};

export const lightColors: ThemeColors = {
  mode: 'light',
  background: '#FFFFFF', // Main light background
  surface: '#FFFFFF',
  surfaceElevated: '#F7F9FC', // Secondary light background
  card: '#FFFFFF',
  border: '#E4E7EC', // Clean light border
  borderSubtle: '#F2F4F7',

  // FotoOwl.AI Warm Golden Yellow
  primary: '#FFB900',
  primaryLight: '#FFC837',
  primaryDark: '#E5A600',
  primaryGradient: ['#FFB900', '#F59E0B'],
  accent: '#FFB900',
  accentAmber: '#FFB900',

  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  textInverse: '#FFFFFF',

  success: '#12B76A',
  error: '#F04438',
  warning: '#F79009',
  info: '#0BA5EC',

  inputBackground: '#FFFFFF',
  inputBorder: '#E4E7EC',
  inputBorderFocused: '#FFB900',
  placeholderText: '#98A2B3',
  disabled: '#F2F4F7',
  overlay: 'rgba(7, 20, 33, 0.65)',
};
