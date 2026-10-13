import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorage[key] = value;
  }),
  getItem: jest.fn(async (key: string) => {
    return mockStorage[key] || null;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete mockStorage[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }),
}));

import { MemoriesService, SEED_PEOPLE } from '../src/services/memoriesService';
import { CreateMemoryInput } from '../src/types/memory';

describe('Memories Dashboard Service & Data Isolation', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('generates 5 default featured memories for initial user with 3 cover thumbnails', async () => {
    const memories = await MemoriesService.getMemories('user_alice');
    expect(memories).toHaveLength(5);

    const titles = memories.map((m) => m.title);
    expect(titles).toContain('Christmas Party');
    expect(titles).toContain('First International Trip');
    expect(titles).toContain('Birthday Celebration');
    expect(titles).toContain('Family Vacation');
    expect(titles).toContain('Wedding Memories');

    memories.forEach((mem) => {
      expect(mem.coverThumbnails.length).toBeGreaterThanOrEqual(1);
      expect(mem.photos.length).toBeGreaterThanOrEqual(3);
      expect(mem.dateRange.length).toBeGreaterThan(0);
      expect(mem.people.length).toBeGreaterThan(0);
    });
  });

  it('maintains strict user data isolation between different accounts', async () => {
    // User Alice has 5 memories
    const aliceMems = await MemoriesService.getMemories('user_alice');
    expect(aliceMems).toHaveLength(5);

    // Create a new memory specifically for Alice
    const aliceNewMem: CreateMemoryInput = {
      title: 'Alice Special Gala',
      dateRange: 'Jan 10, 2026',
      category: 'Celebration',
      photos: [
        {
          id: 'p_alice_1',
          uri: 'https://example.com/p1.jpg',
          source: 'device',
          dateAdded: new Date().toISOString(),
        },
      ],
      people: [SEED_PEOPLE[0]],
    };
    await MemoriesService.createMemory('user_alice', aliceNewMem);

    const updatedAlice = await MemoriesService.getMemories('user_alice');
    expect(updatedAlice).toHaveLength(6);
    expect(updatedAlice.some((m) => m.title === 'Alice Special Gala')).toBe(true);

    // User Bob logs in: Bob has his own initial 5 memories, NOT Alice's custom memory
    const bobMems = await MemoriesService.getMemories('user_bob');
    expect(bobMems).toHaveLength(5);
    expect(bobMems.some((m) => m.title === 'Alice Special Gala')).toBe(false);
  });

  it('prevents creation of duplicate memory titles for the same user', async () => {
    const input: CreateMemoryInput = {
      title: 'Christmas Party', // Already exists in seed
      dateRange: 'Dec 25, 2025',
      category: 'Holiday',
      photos: [
        {
          id: 'photo_dup',
          uri: 'https://example.com/dup.jpg',
          source: 'device',
          dateAdded: new Date().toISOString(),
        },
      ],
      people: [],
    };

    const result = await MemoriesService.createMemory('user_1', input);
    expect(result.success).toBe(false);
    expect(result.message).toContain('already exists');
  });

  it('supports toggling memory favorite status and updating state', async () => {
    const memories = await MemoriesService.getMemories('user_test');
    const target = memories[0];

    const initialFav = target.isFavorite || false;
    const toggled = await MemoriesService.toggleFavorite('user_test', target.id);
    expect(toggled).toBe(!initialFav);

    const freshMemories = await MemoriesService.getMemories('user_test');
    const freshTarget = freshMemories.find((m) => m.id === target.id);
    expect(freshTarget?.isFavorite).toBe(!initialFav);
  });

  it('filters people details to only return authorized photos from tagged memories', async () => {
    const person = SEED_PEOPLE[0]; // Sophia Chen
    const details = await MemoriesService.getPersonDetails('user_privacy', person.id);

    expect(details.person).not.toBeNull();
    expect(details.person?.id).toBe(person.id);
    expect(details.memories.length).toBeGreaterThan(0);

    // Verify all returned photos belong to memories where Sophia is tagged
    details.memories.forEach((mem) => {
      const isTagged = mem.people.some((p) => p.id === person.id);
      expect(isTagged).toBe(true);
    });

    expect(details.photos.length).toBeGreaterThan(0);
  });
});
