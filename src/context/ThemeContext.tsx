import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppTheme, ThemeMode } from '../theme/types';
import { darkTheme, lightTheme } from '../theme/theme';
import { getSavedTheme, saveTheme } from '../storage/asyncStorage';

export interface ThemeContextValue {
  theme: AppTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // FotoOwl.AI default brand foundation: dark theme
  const [themeMode, setMode] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await getSavedTheme();
        if (saved) {
          setMode(saved);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadThemePreference();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setMode(mode);
    try {
      await saveTheme(mode);
    } catch (e) {
      console.error('Failed to persist theme preference', e);
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const activeTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themeMode,
        isDark: themeMode === 'dark',
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
