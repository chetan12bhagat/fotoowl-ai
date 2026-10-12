export interface Photo {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

export type PhotoFilter = 'all' | 'A-M' | 'N-Z';

export interface PhotoListState {
  photos: Photo[];
  page: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
}
