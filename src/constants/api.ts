export const API_BASE_URL = 'https://picsum.photos';
export const DEFAULT_PAGE_LIMIT = 50;

export const ENDPOINTS = {
  PHOTOS_LIST: (page: number = 1, limit: number = DEFAULT_PAGE_LIMIT) =>
    `${API_BASE_URL}/v2/list?page=${page}&limit=${limit}`,
  PHOTO_INFO: (id: string) => `${API_BASE_URL}/id/${id}/info`,
};
