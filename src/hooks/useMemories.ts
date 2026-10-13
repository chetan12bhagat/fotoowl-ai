import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  Memory,
  MemoryPerson,
  MemoryPhotoItem,
  MemoryFilter,
  CreateMemoryInput,
} from '../types/memory';
import { MemoriesService } from '../services/memoriesService';

export interface UseMemoriesReturn {
  memories: Memory[];
  people: MemoryPerson[];
  loading: boolean;
  filter: MemoryFilter;
  setFilter: (filter: MemoryFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredMemories: Memory[];
  counts: {
    all: number;
    my: number;
    shared: number;
    favorites: number;
  };
  createMemory: (input: CreateMemoryInput) => Promise<{ success: boolean; memory?: Memory; message?: string }>;
  deleteMemory: (memoryId: string) => Promise<boolean>;
  toggleFavorite: (memoryId: string) => Promise<boolean>;
  addPhotosToMemory: (memoryId: string, photos: MemoryPhotoItem[]) => Promise<Memory | null>;
  refresh: () => Promise<void>;
}

export const useMemories = (): UseMemoriesReturn => {
  const { user } = useAuth();
  const userId = user?.id || 'demo_user';

  const [memories, setMemories] = useState<Memory[]>([]);
  const [people, setPeople] = useState<MemoryPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<MemoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mems, peeps] = await Promise.all([
        MemoriesService.getMemories(userId),
        MemoriesService.getPeople(userId),
      ]);
      setMemories(mems);
      setPeople(peeps);
    } catch (err) {
      console.error('[useMemories] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const counts = useMemo(() => {
    return {
      all: memories.length,
      my: memories.filter((m) => !m.isShared).length,
      shared: memories.filter((m) => m.isShared).length,
      favorites: memories.filter((m) => m.isFavorite).length,
    };
  }, [memories]);

  const filteredMemories = useMemo(() => {
    let result = memories;

    // Filter by tab: All Memories, My Memories, Shared Memories, Favorites
    if (filter === 'my') {
      result = result.filter((m) => !m.isShared);
    } else if (filter === 'shared') {
      result = result.filter((m) => m.isShared);
    } else if (filter === 'favorites') {
      result = result.filter((m) => m.isFavorite);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.dateRange.toLowerCase().includes(q) ||
          m.people?.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [memories, filter, searchQuery]);

  const createMemory = useCallback(
    async (input: CreateMemoryInput) => {
      const res = await MemoriesService.createMemory(userId, input);
      if (res.success && res.memory) {
        setMemories((prev) => [res.memory!, ...prev]);
        // Also refresh people list
        const updatedPeople = await MemoriesService.getPeople(userId);
        setPeople(updatedPeople);
      }
      return res;
    },
    [userId]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      const ok = await MemoriesService.deleteMemory(userId, memoryId);
      if (ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      }
      return ok;
    },
    [userId]
  );

  const toggleFavorite = useCallback(
    async (memoryId: string) => {
      const newStatus = await MemoriesService.toggleFavorite(userId, memoryId);
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, isFavorite: newStatus } : m))
      );
      return newStatus;
    },
    [userId]
  );

  const addPhotosToMemory = useCallback(
    async (memoryId: string, photos: MemoryPhotoItem[]) => {
      const updated = await MemoriesService.addPhotosToMemory(userId, memoryId, photos);
      if (updated) {
        setMemories((prev) => prev.map((m) => (m.id === memoryId ? updated : m)));
      }
      return updated;
    },
    [userId]
  );

  return {
    memories,
    people,
    loading,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredMemories,
    counts,
    createMemory,
    deleteMemory,
    toggleFavorite,
    addPhotosToMemory,
    refresh: loadData,
  };
};
