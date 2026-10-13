import { Photo } from '../types/photo';
import { ENDPOINTS, DEFAULT_PAGE_LIMIT } from '../constants/api';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch photos from Picsum API with timeout and robust error handling.
 */
export const fetchPhotosApi = async (
  page: number = 1,
  limit: number = DEFAULT_PAGE_LIMIT
): Promise<Photo[]> => {
  const url = ENDPOINTS.PHOTOS_LIST(page, limit);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch photos: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new ApiError('Invalid response format received from photo service.');
    }

    const CATEGORY_MAP: {
      category: Photo['category'];
      event: string;
      album: string;
      title: string;
      tags: string[];
    }[] = [
      {
        category: 'weddings',
        event: 'Ananya & Rohan Royal Wedding',
        album: 'Sangeet & Mandap Rituals',
        title: 'Nuptial Blessings',
        tags: ['wedding', 'mandap', 'bride', 'groom', 'ceremony'],
      },
      {
        category: 'sports',
        event: 'National Athletics Championship',
        album: 'Track & Field Finals',
        title: 'Sprint Finish',
        tags: ['sports', 'athletics', 'winner', 'competition'],
      },
      {
        category: 'music_festivals',
        event: 'Echoes Live Music Festival',
        album: 'Mainstage Performances',
        title: 'Acoustic Euphoria',
        tags: ['music', 'festival', 'concert', 'crowd', 'stage'],
      },
      {
        category: 'corporate_events',
        event: 'Global Tech Leadership Summit',
        album: 'Keynote & Innovation Awards',
        title: 'Vision 2030 Keynote',
        tags: ['corporate', 'conference', 'summit', 'awards', 'tech'],
      },
      {
        category: 'school_events',
        event: 'Heritage International Convocation',
        album: 'Class of 2026 Graduation',
        title: 'Cap Toss Celebration',
        tags: ['school', 'graduation', 'students', 'annual day'],
      },
      {
        category: 'birthday_parties',
        event: 'Leo’s 5th Safari Birthday Bash',
        album: 'Cake Cutting & Games',
        title: 'Birthday Magic',
        tags: ['birthday', 'party', 'cake', 'celebration', 'family'],
      },
      {
        category: 'engagements',
        event: 'Pooja & Siddharth Engagement',
        album: 'Sunset Ring Exchange',
        title: 'Golden Hour Promise',
        tags: ['engagement', 'couple', 'ring', 'pre-wedding'],
      },
      {
        category: 'travel_celebrations',
        event: 'Udaipur Lake Palace Gala',
        album: 'Royal Heritage Retreat',
        title: 'Palace Lanterns',
        tags: ['travel', 'destination', 'palace', 'celebration'],
      },
    ];

    // Map and sanitize photo records with realistic event metadata
    return data.map((item: any) => {
      const numId = Math.abs(parseInt(item.id, 10)) || 0;
      const meta = CATEGORY_MAP[numId % CATEGORY_MAP.length];

      return {
        id: String(item.id),
        author: String(item.author || 'Unknown Artist'),
        width: Number(item.width) || 0,
        height: Number(item.height) || 0,
        url: String(item.url || ''),
        download_url: String(item.download_url || ''),
        category: meta.category,
        title: meta.title,
        event: meta.event,
        album: meta.album,
        tags: meta.tags,
      };
    });
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your internet connection.');
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error.message || 'Unable to load photo gallery. Please check your network and try again.'
    );
  }
};
