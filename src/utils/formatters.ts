import { Photo, PhotoFilter, PhotoCategory } from '../types/photo';

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
 * Filter photos by multi-attribute search query, category filter,
 * and author alphabetic range.
 * Does not mutate the source array.
 */
export const filterPhotos = (
  photos: Photo[],
  searchQuery: string,
  filterRange: PhotoFilter = 'all',
  categoryFilter: PhotoCategory = 'all'
): Photo[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Extract ID if query starts with "id:", "id ", or "#"
  const strippedIdMatch = normalizedQuery.match(/^(?:id\s*[:#\-]?\s*|#\s*)(\w+)$/i);
  const strippedId = strippedIdMatch ? strippedIdMatch[1].toLowerCase() : null;

  return photos.filter((photo) => {
    // 1. Multi-attribute Search matching
    if (normalizedQuery.length > 0) {
      const authorMatch = (photo.author || '').toLowerCase().includes(normalizedQuery);
      
      // Match ID: exact match when query is number/id, or contains stripped id
      const idMatch =
        (photo.id || '').toLowerCase() === normalizedQuery ||
        (strippedId !== null && (photo.id || '').toLowerCase() === strippedId) ||
        (normalizedQuery.length >= 2 && (photo.id || '').toLowerCase().includes(normalizedQuery));

      const titleMatch = Boolean(
        photo.title && photo.title.toLowerCase().includes(normalizedQuery)
      );

      const eventMatch = Boolean(
        photo.event && photo.event.toLowerCase().includes(normalizedQuery)
      );

      const albumMatch = Boolean(
        photo.album && photo.album.toLowerCase().includes(normalizedQuery)
      );

      const filenameMatch = Boolean(
        photo.filename && photo.filename.toLowerCase().includes(normalizedQuery)
      );

      const tagsMatch = Boolean(
        photo.tags && photo.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      );

      // Match URL only if query is at least 3 characters and not a pure single digit
      const isPureSingleDigit = /^\d$/.test(normalizedQuery);
      const urlMatch = Boolean(
        !isPureSingleDigit &&
          normalizedQuery.length >= 3 &&
          photo.url &&
          photo.url.toLowerCase().includes(normalizedQuery)
      );

      const matchesSearch =
        authorMatch ||
        idMatch ||
        titleMatch ||
        eventMatch ||
        albumMatch ||
        filenameMatch ||
        tagsMatch ||
        urlMatch;

      if (!matchesSearch) return false;
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      if (photo.category !== categoryFilter) {
        return false;
      }
    }

    // 3. Alphabetic Range Filter (applied to Author name)
    if (filterRange === 'all') return true;

    const authorName = (photo.author || '').trim();
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
