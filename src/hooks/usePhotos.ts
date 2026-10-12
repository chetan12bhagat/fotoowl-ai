import { useState, useEffect, useCallback, useRef } from 'react';
import { Photo } from '../types/photo';
import { fetchPhotosApi } from '../services/api';
import { DEFAULT_PAGE_LIMIT } from '../constants/api';

export interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

export const usePhotos = (): UsePhotosReturn => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // In-flight guard to avoid simultaneous duplicate requests
  const isFetchingRef = useRef<boolean>(false);

  // Helper to deduplicate photos by ID
  const deduplicatePhotos = (existing: Photo[], incoming: Photo[]): Photo[] => {
    const existingIds = new Set(existing.map((p) => p.id));
    const newItems = incoming.filter((p) => !existingIds.has(p.id));
    return [...existing, ...newItems];
  };

  const loadInitialPhotos = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPhotosApi(1, DEFAULT_PAGE_LIMIT);
      setPhotos(data);
      setPage(1);
      setHasMore(data.length >= DEFAULT_PAGE_LIMIT);
    } catch (err: any) {
      setError(err?.message || 'Failed to load photo gallery.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadInitialPhotos();
  }, [loadInitialPhotos]);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setRefreshing(true);
    setError(null);

    try {
      const data = await fetchPhotosApi(1, DEFAULT_PAGE_LIMIT);
      setPhotos(data);
      setPage(1);
      setHasMore(data.length >= DEFAULT_PAGE_LIMIT);
    } catch (err: any) {
      setError(err?.message || 'Unable to refresh photos.');
    } finally {
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || loading || loadingMore || refreshing) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingMore(true);

    const nextPage = page + 1;

    try {
      const data = await fetchPhotosApi(nextPage, DEFAULT_PAGE_LIMIT);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPhotos((prev) => deduplicatePhotos(prev, data));
        setPage(nextPage);
        setHasMore(data.length >= DEFAULT_PAGE_LIMIT);
      }
    } catch (err: any) {
      console.warn('[usePhotos] Failed to load more photos:', err?.message);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, loading, loadingMore, refreshing, page]);

  const retry = useCallback(async () => {
    await loadInitialPhotos();
  }, [loadInitialPhotos]);

  return {
    photos,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  };
};
