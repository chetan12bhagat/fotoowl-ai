import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Memory,
  MemoryPerson,
  MemoryPhotoItem,
  CreateMemoryInput,
  MemoryThemeColor,
} from '../types/memory';

const MEMORIES_KEY_PREFIX = '@fotoowl_memories_user_';
const PEOPLE_KEY_PREFIX = '@fotoowl_people_user_';

// Curated pastel card themes inspired by the reference image
export const MEMORY_THEMES: Record<string, MemoryThemeColor> = {
  rose: {
    background: '#FFF1F2',
    border: '#FECDD3',
    accent: '#E11D48',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
  },
  sky: {
    background: '#F0F9FF',
    border: '#BAE6FD',
    accent: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
  },
  lavender: {
    background: '#FAF5FF',
    border: '#E9D5FF',
    accent: '#9333EA',
    badgeBg: '#F3E8FF',
    badgeText: '#7E22CE',
  },
  emerald: {
    background: '#F0FDF4',
    border: '#BBF7D0',
    accent: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
  },
  amber: {
    background: '#FFFBEB',
    border: '#FDE68A',
    accent: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
  },
};

// Seed People profiles for memories
export const SEED_PEOPLE: MemoryPerson[] = [
  {
    id: 'person_sophia',
    name: 'Sophia Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    role: 'Friend',
    initials: 'SC',
  },
  {
    id: 'person_rohan',
    name: 'Rohan Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    role: 'Family',
    initials: 'RM',
  },
  {
    id: 'person_elena',
    name: 'Elena Rossi',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
    role: 'Colleague',
    initials: 'ER',
  },
  {
    id: 'person_david',
    name: 'David Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    role: 'Travel Buddy',
    initials: 'DM',
  },
  {
    id: 'person_aarav',
    name: 'Aarav Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop',
    role: 'Friend',
    initials: 'AS',
  },
  {
    id: 'person_priya',
    name: 'Priya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    role: 'Family',
    initials: 'PP',
  },
];

// Seed memories generator matching the prompt's required examples
export const generateSeedMemories = (userId: string): Memory[] => {
  const pSophia = SEED_PEOPLE[0];
  const pRohan = SEED_PEOPLE[1];
  const pElena = SEED_PEOPLE[2];
  const pDavid = SEED_PEOPLE[3];
  const pAarav = SEED_PEOPLE[4];
  const pPriya = SEED_PEOPLE[5];

  return [
    {
      id: 'mem_christmas_party',
      userId,
      title: 'Christmas Party',
      description: 'Holiday dinner, gingerbread house decorating, and gift exchange.',
      dateRange: 'Dec 24 - Dec 25, 2025',
      category: 'Holiday',
      createdAt: '2025-12-25T20:00:00Z',
      updatedAt: '2025-12-25T20:00:00Z',
      isFavorite: true,
      isShared: true,
      themeColor: MEMORY_THEMES.rose,
      coverThumbnails: [
        'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=600&auto=format&fit=crop',
      ],
      photos: [
        {
          id: 'photo_xmas_1',
          uri: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=1200&auto=format&fit=crop',
          title: 'Festive Lights & Fir Tree',
          source: 'fotoowl',
          dateAdded: '2025-12-24T18:30:00Z',
        },
        {
          id: 'photo_xmas_2',
          uri: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=1200&auto=format&fit=crop',
          title: 'Holiday Dinner Table',
          source: 'fotoowl',
          dateAdded: '2025-12-24T20:15:00Z',
        },
        {
          id: 'photo_xmas_3',
          uri: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=1200&auto=format&fit=crop',
          title: 'Gift Opening Ceremony',
          source: 'fotoowl',
          dateAdded: '2025-12-25T10:00:00Z',
        },
        {
          id: 'photo_xmas_4',
          uri: 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=1200&auto=format&fit=crop',
          title: 'Snow & Hearth Warmth',
          source: 'fotoowl',
          dateAdded: '2025-12-25T14:45:00Z',
        },
      ],
      people: [pSophia, pRohan, pElena],
    },
    {
      id: 'mem_international_trip',
      userId,
      title: 'First International Trip',
      description: 'Exploring historic avenues, sunset boat cruises, and cobblestone cafes.',
      dateRange: 'Nov 10 - Nov 18, 2025',
      category: 'Travel',
      createdAt: '2025-11-18T18:00:00Z',
      updatedAt: '2025-11-18T18:00:00Z',
      isFavorite: true,
      isShared: false,
      themeColor: MEMORY_THEMES.sky,
      coverThumbnails: [
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
      ],
      photos: [
        {
          id: 'photo_trip_1',
          uri: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
          title: 'Desert Canyon Journey',
          source: 'fotoowl',
          dateAdded: '2025-11-11T09:00:00Z',
        },
        {
          id: 'photo_trip_2',
          uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
          title: 'Old Town Architecture',
          source: 'fotoowl',
          dateAdded: '2025-11-13T14:20:00Z',
        },
        {
          id: 'photo_trip_3',
          uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
          title: 'Coastal Golden Hour',
          source: 'fotoowl',
          dateAdded: '2025-11-15T18:45:00Z',
        },
        {
          id: 'photo_trip_4',
          uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
          title: 'Alpine Vista Peak',
          source: 'fotoowl',
          dateAdded: '2025-11-17T11:10:00Z',
        },
      ],
      people: [pDavid, pSophia, pAarav],
    },
    {
      id: 'mem_birthday_celebration',
      userId,
      title: 'Birthday Celebration',
      description: 'Surprise party, candle wishes, and rooftop fireworks.',
      dateRange: 'Oct 05, 2025',
      category: 'Birthday',
      createdAt: '2025-10-05T22:00:00Z',
      updatedAt: '2025-10-05T22:00:00Z',
      isFavorite: false,
      isShared: true,
      themeColor: MEMORY_THEMES.lavender,
      coverThumbnails: [
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop',
      ],
      photos: [
        {
          id: 'photo_bday_1',
          uri: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200&auto=format&fit=crop',
          title: 'Confetti & Balloons',
          source: 'fotoowl',
          dateAdded: '2025-10-05T19:00:00Z',
        },
        {
          id: 'photo_bday_2',
          uri: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=1200&auto=format&fit=crop',
          title: 'Birthday Cake Cutting',
          source: 'fotoowl',
          dateAdded: '2025-10-05T20:30:00Z',
        },
        {
          id: 'photo_bday_3',
          uri: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop',
          title: 'Party Streamers',
          source: 'fotoowl',
          dateAdded: '2025-10-05T21:45:00Z',
        },
      ],
      people: [pAarav, pRohan, pPriya],
    },
    {
      id: 'mem_family_vacation',
      userId,
      title: 'Family Vacation',
      description: 'Lakeside cabin retreat, morning fishing, and evening campfire stories.',
      dateRange: 'Aug 14 - Aug 20, 2025',
      category: 'Family',
      createdAt: '2025-08-20T16:00:00Z',
      updatedAt: '2025-08-20T16:00:00Z',
      isFavorite: true,
      isShared: true,
      themeColor: MEMORY_THEMES.emerald,
      coverThumbnails: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop',
      ],
      photos: [
        {
          id: 'photo_fam_1',
          uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
          title: 'Mountain Lake Cruise',
          source: 'fotoowl',
          dateAdded: '2025-08-15T10:15:00Z',
        },
        {
          id: 'photo_fam_2',
          uri: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1200&auto=format&fit=crop',
          title: 'Lakeside Campfire',
          source: 'fotoowl',
          dateAdded: '2025-08-17T20:00:00Z',
        },
        {
          id: 'photo_fam_3',
          uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop',
          title: 'Sunset Over the Water',
          source: 'fotoowl',
          dateAdded: '2025-08-19T18:30:00Z',
        },
      ],
      people: [pPriya, pRohan, pDavid],
    },
    {
      id: 'mem_wedding_memories',
      userId,
      title: 'Wedding Memories',
      description: 'Grand royal wedding celebration, mandap ceremonies, and gala dinner.',
      dateRange: 'Jun 10 - Jun 12, 2025',
      category: 'Wedding',
      createdAt: '2025-06-12T23:00:00Z',
      updatedAt: '2025-06-12T23:00:00Z',
      isFavorite: true,
      isShared: true,
      themeColor: MEMORY_THEMES.amber,
      coverThumbnails: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop',
      ],
      photos: [
        {
          id: 'photo_wed_1',
          uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
          title: 'Ceremonial Vows',
          source: 'fotoowl',
          dateAdded: '2025-06-11T16:00:00Z',
        },
        {
          id: 'photo_wed_2',
          uri: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
          title: 'Couple First Dance',
          source: 'fotoowl',
          dateAdded: '2025-06-11T21:30:00Z',
        },
        {
          id: 'photo_wed_3',
          uri: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
          title: 'Royal Mandap Flowers',
          source: 'fotoowl',
          dateAdded: '2025-06-12T11:00:00Z',
        },
      ],
      people: [pRohan, pElena, pAarav, pSophia],
    },
  ];
};

/**
 * Service to manage User Memories and People with strict account isolation.
 */
export const MemoriesService = {
  /**
   * Fetch all memories for the authenticated user.
   * If this is a first-time user, seed default demo memories.
   */
  async getMemories(userId: string = 'default'): Promise<Memory[]> {
    try {
      const storageKey = `${MEMORIES_KEY_PREFIX}${userId}`;
      const data = await AsyncStorage.getItem(storageKey);

      if (!data) {
        // Initialize seed memories
        const initial = generateSeedMemories(userId);
        await AsyncStorage.setItem(storageKey, JSON.stringify(initial));
        return initial;
      }

      const parsed: Memory[] = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch (error) {
      console.error('[MemoriesService] Error fetching memories:', error);
      return [];
    }
  },

  /**
   * Create a new memory. Checks for duplicate title for this user.
   */
  async createMemory(
    userId: string,
    input: CreateMemoryInput
  ): Promise<{ success: boolean; memory?: Memory; message?: string }> {
    try {
      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) {
        return { success: false, message: 'Please provide a title for your memory.' };
      }

      const existingMemories = await this.getMemories(userId);
      const isDuplicate = existingMemories.some(
        (m) => m.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
      );

      if (isDuplicate) {
        return {
          success: false,
          message: 'A memory with this title already exists. Please choose a unique title.',
        };
      }

      // Compute top 3 cover thumbnails from selected photos
      const coverThumbnails = input.photos.slice(0, 3).map((p) => p.thumbnailUri || p.uri);

      // Default theme if none selected
      const themeColor = input.themeColor || MEMORY_THEMES.amber;

      const newMemory: Memory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: trimmedTitle,
        description: input.description?.trim(),
        dateRange: input.dateRange.trim() || 'Recently Added',
        category: input.category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photos: input.photos,
        coverThumbnails,
        people: input.people || [],
        isShared: input.isShared || false,
        isFavorite: false,
        themeColor,
      };

      const updated = [newMemory, ...existingMemories];
      const storageKey = `${MEMORIES_KEY_PREFIX}${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

      return { success: true, memory: newMemory };
    } catch (error: any) {
      console.error('[MemoriesService] Error creating memory:', error);
      return { success: false, message: error?.message || 'Failed to save memory.' };
    }
  },

  /**
   * Delete a memory for the user.
   */
  async deleteMemory(userId: string, memoryId: string): Promise<boolean> {
    try {
      const memories = await this.getMemories(userId);
      const updated = memories.filter((m) => m.id !== memoryId);
      const storageKey = `${MEMORIES_KEY_PREFIX}${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('[MemoriesService] Error deleting memory:', error);
      return false;
    }
  },

  /**
   * Toggle memory favorite state.
   */
  async toggleFavorite(userId: string, memoryId: string): Promise<boolean> {
    try {
      const memories = await this.getMemories(userId);
      let newFavoriteStatus = false;
      const updated = memories.map((m) => {
        if (m.id === memoryId) {
          newFavoriteStatus = !m.isFavorite;
          return { ...m, isFavorite: newFavoriteStatus, updatedAt: new Date().toISOString() };
        }
        return m;
      });

      const storageKey = `${MEMORIES_KEY_PREFIX}${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      return newFavoriteStatus;
    } catch (error) {
      console.error('[MemoriesService] Error toggling favorite:', error);
      return false;
    }
  },

  /**
   * Add photos to an existing memory.
   */
  async addPhotosToMemory(
    userId: string,
    memoryId: string,
    newPhotos: MemoryPhotoItem[]
  ): Promise<Memory | null> {
    try {
      const memories = await this.getMemories(userId);
      let updatedMemory: Memory | null = null;

      const updated = memories.map((m) => {
        if (m.id === memoryId) {
          const combinedPhotos = [...newPhotos, ...m.photos];
          const newCoverThumbnails = combinedPhotos
            .slice(0, 3)
            .map((p) => p.thumbnailUri || p.uri);
          updatedMemory = {
            ...m,
            photos: combinedPhotos,
            coverThumbnails: newCoverThumbnails,
            updatedAt: new Date().toISOString(),
          };
          return updatedMemory;
        }
        return m;
      });

      if (updatedMemory) {
        const storageKey = `${MEMORIES_KEY_PREFIX}${userId}`;
        await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      }

      return updatedMemory;
    } catch (error) {
      console.error('[MemoriesService] Error adding photos to memory:', error);
      return null;
    }
  },

  /**
   * Get distinct people tagged in the user's memories.
   */
  async getPeople(userId: string = 'default'): Promise<MemoryPerson[]> {
    try {
      const memories = await this.getMemories(userId);
      const peopleMap = new Map<string, MemoryPerson>();

      // Populate from memories
      memories.forEach((mem) => {
        mem.people?.forEach((person) => {
          if (!peopleMap.has(person.id)) {
            peopleMap.set(person.id, person);
          }
        });
      });

      // If user has seed or registered people, ensure seed people are included
      SEED_PEOPLE.forEach((p) => {
        if (!peopleMap.has(p.id)) {
          peopleMap.set(p.id, p);
        }
      });

      return Array.from(peopleMap.values());
    } catch (error) {
      console.error('[MemoriesService] Error fetching people:', error);
      return SEED_PEOPLE;
    }
  },

  /**
   * Get person details and only authorized photos/memories where this person appears.
   */
  async getPersonDetails(
    userId: string,
    personId: string
  ): Promise<{ person: MemoryPerson | null; memories: Memory[]; photos: MemoryPhotoItem[] }> {
    try {
      const memories = await this.getMemories(userId);
      const allPeople = await this.getPeople(userId);

      const person = allPeople.find((p) => p.id === personId) || null;
      if (!person) {
        return { person: null, memories: [], photos: [] };
      }

      // Find all memories containing this person
      const taggedMemories = memories.filter((m) =>
        m.people?.some((p) => p.id === personId)
      );

      // Collect all photos from authorized memories
      const photoMap = new Map<string, MemoryPhotoItem>();
      taggedMemories.forEach((mem) => {
        mem.photos?.forEach((photo) => {
          if (!photoMap.has(photo.id)) {
            photoMap.set(photo.id, photo);
          }
        });
      });

      return {
        person,
        memories: taggedMemories,
        photos: Array.from(photoMap.values()),
      };
    } catch (error) {
      console.error('[MemoriesService] Error fetching person details:', error);
      return { person: null, memories: [], photos: [] };
    }
  },
};
