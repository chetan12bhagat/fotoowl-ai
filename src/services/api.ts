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

    // Map and sanitize photo records
    return data.map((item: any) => ({
      id: String(item.id),
      author: String(item.author || 'Unknown Artist'),
      width: Number(item.width) || 0,
      height: Number(item.height) || 0,
      url: String(item.url || ''),
      download_url: String(item.download_url || ''),
    }));
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
