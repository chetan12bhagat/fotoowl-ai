import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthSession } from '../types/user';
import { Photo } from '../types/photo';
import { ThemeMode } from '../theme/types';

const STORAGE_KEYS = {
  SESSION: '@fotoowl_session',
  USERS: '@fotoowl_users',
  FAVORITES: '@fotoowl_favorites',
  THEME: '@fotoowl_theme',
};

// ------------------------------------------------------------
// Authentication & Session Persistence
// ------------------------------------------------------------

export const saveAuthSession = async (session: AuthSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('[Storage] Error saving auth session:', error);
    throw error;
  }
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    console.error('[Storage] Error reading auth session:', error);
    return null;
  }
};

export const clearAuthSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (error) {
    console.error('[Storage] Error clearing auth session:', error);
    throw error;
  }
};

// ------------------------------------------------------------
// Registered Users Persistence
// ------------------------------------------------------------

export const getRegisteredUsers = async (): Promise<User[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch (error) {
    console.error('[Storage] Error reading registered users:', error);
    return [];
  }
};

export const saveRegisteredUser = async (user: User): Promise<void> => {
  try {
    const users = await getRegisteredUsers();
    // Check duplicate email (case-insensitive)
    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('[Storage] Error saving registered user:', error);
    throw error;
  }
};

export const updateUserProfileInRegistry = async (
  updatedUser: User
): Promise<void> => {
  try {
    const users = await getRegisteredUsers();
    const updatedList = users.map((u) =>
      u.email.toLowerCase() === updatedUser.email.toLowerCase() ? updatedUser : u
    );
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList));
  } catch (error) {
    console.error('[Storage] Error updating profile in registry:', error);
    throw error;
  }
};

// ------------------------------------------------------------
// Favorites Persistence
// ------------------------------------------------------------

export const getSavedFavorites = async (): Promise<Photo[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) return [];
    return JSON.parse(raw) as Photo[];
  } catch (error) {
    console.error('[Storage] Error reading favorites:', error);
    return [];
  }
};

export const saveFavorites = async (favorites: Photo[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('[Storage] Error saving favorites:', error);
    throw error;
  }
};

// ------------------------------------------------------------
// Theme Preference Persistence
// ------------------------------------------------------------

export const getSavedTheme = async (): Promise<ThemeMode | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    return null;
  } catch (error) {
    console.error('[Storage] Error reading theme mode:', error);
    return null;
  }
};

export const saveTheme = async (mode: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
  } catch (error) {
    console.error('[Storage] Error saving theme mode:', error);
    throw error;
  }
};
