export interface Photo {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
  title?: string;
  event?: string;
  album?: string;
  filename?: string;
  tags?: string[];
  category?: PhotoCategory;
}

export type PhotoFilter = 'all' | 'A-M' | 'N-Z';

export type PhotoCategory =
  | 'all'
  | 'weddings'
  | 'sports'
  | 'music_festivals'
  | 'corporate_events'
  | 'school_events'
  | 'birthday_parties'
  | 'engagements'
  | 'travel_celebrations';

export interface CategoryInfo {
  id: PhotoCategory;
  title: string;
  subtitle: string;
  imageUrl: string;
  countLabel?: string;
  tags?: string[];
}

export interface PhotoListState {
  photos: Photo[];
  page: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
}
