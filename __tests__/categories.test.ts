import { describe, it, expect } from '@jest/globals';
import { PHOTO_CATEGORIES } from '../src/constants/categories';

describe('Category System and Filter Behavior', () => {
  it('provides all 8 curated FotoOwl categories with complete metadata', () => {
    expect(PHOTO_CATEGORIES).toHaveLength(8);

    const categoryIds = PHOTO_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toEqual([
      'weddings',
      'engagements',
      'birthday_parties',
      'corporate_events',
      'music_festivals',
      'sports',
      'school_events',
      'travel_celebrations',
    ]);

    PHOTO_CATEGORIES.forEach((cat) => {
      expect(cat.title.length).toBeGreaterThan(0);
      expect(cat.subtitle.length).toBeGreaterThan(0);
      expect(cat.imageUrl).toMatch(/^https?:\/\//);
      expect(cat.countLabel).toMatch(/\d+(\.\d+)?k?\+?\s+moments/i);
    });
  });

  it('correctly filters categories by search keywords matching title or subtitle', () => {
    const searchKeywords = (q: string) => {
      const term = q.toLowerCase().trim();
      return PHOTO_CATEGORIES.filter(
        (cat) =>
          cat.title.toLowerCase().includes(term) ||
          cat.subtitle.toLowerCase().includes(term) ||
          cat.id.toLowerCase().includes(term)
      );
    };

    // Searching 'wedding' matches Weddings
    const weddingMatches = searchKeywords('wedding');
    expect(weddingMatches.length).toBeGreaterThanOrEqual(1);
    expect(weddingMatches[0].id).toBe('weddings');

    // Searching 'sport' matches Sports
    const sportsMatches = searchKeywords('sport');
    expect(sportsMatches.length).toBeGreaterThanOrEqual(1);
    expect(sportsMatches[0].id).toBe('sports');

    // Searching 'birthday' matches Birthday Parties
    const birthdayMatches = searchKeywords('birthday');
    expect(birthdayMatches.length).toBeGreaterThanOrEqual(1);
    expect(birthdayMatches[0].id).toBe('birthday_parties');

    // Searching non-existent keyword returns empty array
    expect(searchKeywords('xyznonexistent')).toHaveLength(0);
  });

  it('determines active filter status accurately: only true when non-null and not "all"', () => {
    const isFilterActive = (selectedCategory: string | null | undefined): boolean => {
      return Boolean(selectedCategory && selectedCategory !== 'all');
    };

    // When default home viewing with null, filter row must NOT be active
    expect(isFilterActive(null)).toBe(false);
    expect(isFilterActive(undefined)).toBe(false);

    // When 'all' is selected, filter row must NOT be active
    expect(isFilterActive('all')).toBe(false);

    // When a specific category is selected, filter row IS active
    expect(isFilterActive('weddings')).toBe(true);
    expect(isFilterActive('sports')).toBe(true);
    expect(isFilterActive('corporate_events')).toBe(true);
  });

  it('matches categories by rich synonym tags and handles search submission matching', () => {
    const findCategoryMatch = (query: string) => {
      const q = query.toLowerCase().trim();
      return PHOTO_CATEGORIES.find(
        (cat) =>
          cat.title.toLowerCase() === q ||
          cat.id.toLowerCase() === q ||
          cat.title.toLowerCase().includes(q) ||
          cat.subtitle.toLowerCase().includes(q) ||
          (cat.tags && cat.tags.some((tag) => tag.toLowerCase() === q || tag.toLowerCase().includes(q)))
      );
    };

    // Submitting 'football' or 'athlete' resolves to sports
    expect(findCategoryMatch('football')?.id).toBe('sports');
    expect(findCategoryMatch('athlete')?.id).toBe('sports');

    // Submitting 'concert' or 'band' resolves to music_festivals
    expect(findCategoryMatch('concert')?.id).toBe('music_festivals');
    expect(findCategoryMatch('festival')?.id).toBe('music_festivals');

    // Submitting 'bride' resolves to weddings
    expect(findCategoryMatch('bride')?.id).toBe('weddings');

    // Submitting 'conference' or 'summit' resolves to corporate_events
    expect(findCategoryMatch('conference')?.id).toBe('corporate_events');

    // Submitting non-matching term returns undefined
    expect(findCategoryMatch('unknownqwerty')).toBeUndefined();
  });
});
