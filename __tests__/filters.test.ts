import { describe, it, expect } from '@jest/globals';
import { filterPhotos } from '../src/utils/formatters';
import { Photo } from '../src/types/photo';

describe('Photo Filtering and Search Utilities', () => {
  const samplePhotos: Photo[] = [
    {
      id: '1',
      author: 'Alejandro Escamilla',
      width: 5000,
      height: 3333,
      url: 'https://unsplash.com/photos/y83Wfhqn61Y',
      download_url: 'https://picsum.photos/id/1/5000/3333',
    },
    {
      id: '2',
      author: 'Danielle MacInnes',
      width: 4000,
      height: 2667,
      url: 'https://unsplash.com/photos/N3NQ55v89_w',
      download_url: 'https://picsum.photos/id/2/4000/2667',
    },
    {
      id: '3',
      author: 'Paul Jarvis',
      width: 2500,
      height: 1667,
      url: 'https://unsplash.com/photos/6W4F62sN_yI',
      download_url: 'https://picsum.photos/id/3/2500/1667',
    },
    {
      id: '4',
      author: 'Zachary Staines',
      width: 2500,
      height: 1667,
      url: 'https://unsplash.com/photos/m18iaX1q21s',
      download_url: 'https://picsum.photos/id/4/2500/1667',
    },
    {
      id: '5',
      author: 'Nico van Dijk',
      width: 3000,
      height: 2000,
      url: 'https://unsplash.com/photos/abc',
      download_url: 'https://picsum.photos/id/5/3000/2000',
    },
  ];

  it('returns all photos when search is empty and filter is "all"', () => {
    const results = filterPhotos(samplePhotos, '', 'all');
    expect(results.length).toBe(5);
  });

  it('filters photos by author name in case-insensitive fashion', () => {
    const results = filterPhotos(samplePhotos, 'alejandro', 'all');
    expect(results.length).toBe(1);
    expect(results[0].author).toBe('Alejandro Escamilla');

    const partialResults = filterPhotos(samplePhotos, 'JARVIS', 'all');
    expect(partialResults.length).toBe(1);
    expect(partialResults[0].author).toBe('Paul Jarvis');
  });

  it('filters authors in range A-M correctly', () => {
    // A-M: Alejandro (A), Danielle (D)
    const results = filterPhotos(samplePhotos, '', 'A-M');
    expect(results.length).toBe(2);
    expect(results.map((r) => r.author)).toEqual([
      'Alejandro Escamilla',
      'Danielle MacInnes',
    ]);
  });

  it('filters authors in range N-Z correctly', () => {
    // N-Z: Paul Jarvis (P), Zachary Staines (Z), Nico van Dijk (N)
    const results = filterPhotos(samplePhotos, '', 'N-Z');
    expect(results.length).toBe(3);
    expect(results.map((r) => r.author)).toEqual([
      'Paul Jarvis',
      'Zachary Staines',
      'Nico van Dijk',
    ]);
  });

  it('works when search query and range filters are applied simultaneously', () => {
    // Search "ar" in range N-Z: matches "Paul Jarvis" (P) and "Zachary Staines" (Z)
    const results = filterPhotos(samplePhotos, 'ar', 'N-Z');
    expect(results.length).toBe(2);

    // Search "danielle" in range N-Z: should be 0 because Danielle starts with D
    const emptyResults = filterPhotos(samplePhotos, 'danielle', 'N-Z');
    expect(emptyResults.length).toBe(0);
  });

  it('does not mutate the original photos array', () => {
    const cloned = [...samplePhotos];
    filterPhotos(samplePhotos, 'paul', 'N-Z');
    expect(samplePhotos).toEqual(cloned);
  });

  it('filters photos by photo ID including "id: X" or "#X" syntax', () => {
    const idResults = filterPhotos(samplePhotos, '3', 'all');
    expect(idResults.length).toBe(1);
    expect(idResults[0].id).toBe('3');

    const prefixResults = filterPhotos(samplePhotos, 'id: 2', 'all');
    expect(prefixResults.length).toBe(1);
    expect(prefixResults[0].id).toBe('2');

    const hashResults = filterPhotos(samplePhotos, '#4', 'all');
    expect(hashResults.length).toBe(1);
    expect(hashResults[0].id).toBe('4');
  });

  it('filters photos by title, event, album, and tags when available', () => {
    const richPhotos: Photo[] = [
      {
        id: '10',
        author: 'Sarah Jenkins',
        width: 3000,
        height: 2000,
        url: 'https://unsplash.com/photos/wedding-first-dance',
        download_url: 'https://picsum.photos/id/10/3000/2000',
        title: 'Sunset Nuptials',
        event: 'Emma & Liam Wedding',
        album: 'Ceremony Highlights',
        tags: ['reception', 'dance', 'lights'],
      },
      {
        id: '11',
        author: 'David Miller',
        width: 3000,
        height: 2000,
        url: 'https://unsplash.com/photos/mountain-portrait',
        download_url: 'https://picsum.photos/id/11/3000/2000',
        title: 'Alpine Vista',
        event: 'Outdoor Reception',
        album: 'Portraits',
        tags: ['mountains', 'couple'],
      },
    ];

    expect(filterPhotos(richPhotos, 'nuptials', 'all')).toHaveLength(1);
    expect(filterPhotos(richPhotos, 'wedding', 'all')).toHaveLength(1);
    expect(filterPhotos(richPhotos, 'ceremony', 'all')).toHaveLength(1);
    expect(filterPhotos(richPhotos, 'reception', 'all')).toHaveLength(2);
  });

  it('filters photos by category and integrates with search queries', () => {
    const categorizedPhotos: Photo[] = [
      {
        id: '1',
        author: 'Priya Sharma',
        width: 3000,
        height: 2000,
        url: 'https://unsplash.com/wedding-1',
        download_url: 'https://picsum.photos/id/1/3000/2000',
        category: 'weddings',
      },
      {
        id: '2',
        author: 'Marcus Vance',
        width: 3000,
        height: 2000,
        url: 'https://unsplash.com/sports-1',
        download_url: 'https://picsum.photos/id/2/3000/2000',
        category: 'sports',
      },
      {
        id: '3',
        author: 'Priya Sharma',
        width: 3000,
        height: 2000,
        url: 'https://unsplash.com/sports-2',
        download_url: 'https://picsum.photos/id/3/3000/2000',
        category: 'sports',
      },
    ];

    // Filter by category
    expect(filterPhotos(categorizedPhotos, '', 'all', 'weddings')).toHaveLength(1);
    expect(filterPhotos(categorizedPhotos, '', 'all', 'sports')).toHaveLength(2);

    // Combined category and search query
    const priyaSports = filterPhotos(categorizedPhotos, 'Priya', 'all', 'sports');
    expect(priyaSports).toHaveLength(1);
    expect(priyaSports[0].id).toBe('3');

    // Return all when category is 'all'
    expect(filterPhotos(categorizedPhotos, '', 'all', 'all')).toHaveLength(3);
  });
});

