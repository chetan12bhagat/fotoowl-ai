import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Photo } from '../types/photo';
import { getSavedFavorites, saveFavorites } from '../storage/asyncStorage';

export interface FavoritesContextValue {
  favorites: Photo[];
  favoritesCount: number;
  isFavorite: (photoId: string) => boolean;
  toggleFavorite: (photo: Photo) => Promise<void>;
  removeFavorite: (photoId: string) => Promise<void>;
  isLoading: boolean;
}

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved favorites on launch
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await getSavedFavorites();
        setFavorites(stored);
      } catch (error) {
        console.error('[FavoritesContext] Error loading favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Set for fast O(1) lookup
  const favoriteIdSet = useMemo(() => {
    return new Set(favorites.map((p) => p.id));
  }, [favorites]);

  const isFavorite = (photoId: string): boolean => {
    return favoriteIdSet.has(photoId);
  };

  const toggleFavorite = async (photo: Photo): Promise<void> => {
    try {
      let updated: Photo[];
      if (favoriteIdSet.has(photo.id)) {
        updated = favorites.filter((p) => p.id !== photo.id);
      } else {
        // Add photo to favorites (newest first)
        updated = [photo, ...favorites];
      }

      setFavorites(updated);
      await saveFavorites(updated);
    } catch (error) {
      console.error('[FavoritesContext] Error toggling favorite:', error);
    }
  };

  const removeFavorite = async (photoId: string): Promise<void> => {
    try {
      const updated = favorites.filter((p) => p.id !== photoId);
      setFavorites(updated);
      await saveFavorites(updated);
    } catch (error) {
      console.error('[FavoritesContext] Error removing favorite:', error);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount: favorites.length,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
