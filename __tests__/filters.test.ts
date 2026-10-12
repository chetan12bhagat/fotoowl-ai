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
});
