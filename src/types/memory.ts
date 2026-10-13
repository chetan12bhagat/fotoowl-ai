export interface MemoryPerson {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  initials?: string;
}

export interface MemoryPhotoItem {
  id: string;
  uri: string;
  thumbnailUri?: string;
  title?: string;
  caption?: string;
  source: 'device' | 'fotoowl';
  dateAdded: string;
  width?: number;
  height?: number;
}

export type MemoryFilter = 'all' | 'my' | 'shared' | 'favorites';

export interface MemoryThemeColor {
  background: string;
  border: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dateRange: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  coverThumbnails: string[];
  photos: MemoryPhotoItem[];
  people: MemoryPerson[];
  isShared?: boolean;
  isFavorite?: boolean;
  themeColor?: MemoryThemeColor;
}

export interface CreateMemoryInput {
  title: string;
  description?: string;
  dateRange: string;
  category: string;
  photos: MemoryPhotoItem[];
  people: MemoryPerson[];
  isShared?: boolean;
  themeColor?: MemoryThemeColor;
}
