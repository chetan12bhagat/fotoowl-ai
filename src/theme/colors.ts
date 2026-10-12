import { ThemeColors } from './types';

export const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#0B111E', // Deep charcoal navy foundation
  surface: '#131D31',
  surfaceElevated: '#1B273F',
  card: '#152037',
  border: '#24324F',
  borderSubtle: '#1C273E',

  // FotoOwl.AI Teal & Electric Cyan branding
  primary: '#06B6D4', // Vibrant Teal
  primaryLight: '#38BDF8',
  primaryDark: '#0891B2',
  primaryGradient: ['#06B6D4', '#0284C7'],
  accent: '#22D3EE',
  accentAmber: '#F59E0B',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B111E',

  success: '#10B981',
  error: '#F43F5E',
  warning: '#F59E0B',
  info: '#38BDF8',

  inputBackground: '#111A2C',
  inputBorder: '#24324F',
  inputBorderFocused: '#06B6D4',
  placeholderText: '#64748B',
  disabled: '#334155',
  overlay: 'rgba(5, 8, 15, 0.75)',
};

export const lightColors: ThemeColors = {
  mode: 'light',
  background: '#F8FAFC', // Soft neutral background
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#EDF2F7',

  // FotoOwl.AI Teal
  primary: '#0891B2',
  primaryLight: '#06B6D4',
  primaryDark: '#0E7490',
  primaryGradient: ['#0891B2', '#0284C7'],
  accent: '#06B6D4',
  accentAmber: '#D97706',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  success: '#059669',
  error: '#E11D48',
  warning: '#D97706',
  info: '#0284C7',

  inputBackground: '#F1F5F9',
  inputBorder: '#CBD5E1',
  inputBorderFocused: '#0891B2',
  placeholderText: '#94A3B8',
  disabled: '#E2E8F0',
  overlay: 'rgba(15, 23, 42, 0.6)',
};
