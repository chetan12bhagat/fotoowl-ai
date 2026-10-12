import { Photo, PhotoFilter } from '../types/photo';

export const formatDimensions = (width?: number, height?: number): string => {
  if (!width || !height) return '';
  return `${width} × ${height} px`;
};

export const formatMobile = (mobile: string): string => {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
};

/**
 * Filter photos by search query and author alphabetic range.
 * Does not mutate the source array.
 */
export const filterPhotos = (
  photos: Photo[],
  searchQuery: string,
  filterRange: PhotoFilter
): Photo[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return photos.filter((photo) => {
    // 1. Author Name Search (Case-insensitive)
    const authorName = (photo.author || '').trim();
    const matchesSearch =
      normalizedQuery.length === 0 ||
      authorName.toLowerCase().includes(normalizedQuery);

    if (!matchesSearch) return false;

    // 2. Alphabetic Range Filter
    if (filterRange === 'all') return true;

    const firstChar = authorName.charAt(0).toUpperCase();

    if (filterRange === 'A-M') {
      return firstChar >= 'A' && firstChar <= 'M';
    }

    if (filterRange === 'N-Z') {
      return firstChar >= 'N' && firstChar <= 'Z';
    }

    return true;
  });
};
