import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryInfo, PhotoCategory } from '../types/photo';
import { PHOTO_CATEGORIES } from '../constants/categories';
import { CategoryCard } from './CategoryCard';
import { useTheme } from '../hooks/useTheme';

export interface PhotoCategoriesProps {
  selectedCategory?: PhotoCategory | null;
  onSelectCategory: (category: PhotoCategory) => void;
  searchFilter?: string;
  onClearSearch?: () => void;
  style?: ViewStyle;
}

export const PhotoCategories: React.FC<PhotoCategoriesProps> = ({
  selectedCategory = null,
  onSelectCategory,
  searchFilter = '',
  onClearSearch,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  // Filter categories by search term if user is searching on Home
  const displayedCategories = React.useMemo(() => {
    if (!searchFilter.trim()) return PHOTO_CATEGORIES;
    const q = searchFilter.toLowerCase().trim();
    return PHOTO_CATEGORIES.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.subtitle.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        (cat.tags && cat.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }, [searchFilter]);

  // Responsive column count:
  // Mobile (< 640px): strictly 2 columns
  // Tablet (640px - 960px): 3 columns
  // Desktop (>= 960px): 4 columns
  const numColumns = windowWidth >= 960 ? 4 : windowWidth >= 640 ? 3 : 2;

  // Group categories into equal rows for 100% width distribution with zero empty space
  const rows = React.useMemo(() => {
    const result: CategoryInfo[][] = [];
    for (let i = 0; i < displayedCategories.length; i += numColumns) {
      result.push(displayedCategories.slice(i, i + numColumns));
    }
    return result;
  }, [displayedCategories, numColumns]);

  const handleCardPress = (id: PhotoCategory) => {
    onSelectCategory(id);
  };

  // Only show the active filter indicator when a specific category is actively selected
  const hasActiveFilter = Boolean(selectedCategory && selectedCategory !== 'all');
  const activeCategoryTitle = hasActiveFilter
    ? PHOTO_CATEGORIES.find((c) => c.id === selectedCategory)?.title || selectedCategory
    : '';

  return (
    <View style={[styles.outerWrapper, style]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
            borderColor: '#FFB900', // Thin, elegant gold border
          },
        ]}
      >
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <View style={styles.badgeRow}>
              <View style={styles.brandIconBubble}>
                <Ionicons name="sparkles" size={11} color="#071421" />
              </View>
              <Text style={styles.badgeText}>CURATED EVENT MEDIA</Text>
            </View>

            <Text
              style={[
                styles.mainHeading,
                { color: isDark ? '#FFFFFF' : '#101828' },
              ]}
            >
              Explore Photo Categories
            </Text>

            <Text
              style={[
                styles.subHeading,
                { color: isDark ? '#94A3B8' : '#667085' },
              ]}
            >
              Discover beautiful moments from every occasion.
            </Text>
          </View>
        </View>

        {/* Dynamic Search Results Feedback */}
        {searchFilter.trim().length > 0 && (
          <View style={styles.searchResultsRow}>
            <View style={styles.searchResultsLeft}>
              <Ionicons name="search" size={13} color="#FFB900" />
              <Text style={[styles.searchResultsText, { color: isDark ? '#E2E8F0' : '#344054' }]}>
                Found <Text style={styles.resultsCountBold}>{displayedCategories.length}</Text>{' '}
                {displayedCategories.length === 1 ? 'category' : 'categories'} for{' '}
                <Text style={styles.resultsQueryBold}>"{searchFilter.trim()}"</Text>
              </Text>
            </View>
            {onClearSearch && (
              <TouchableOpacity
                onPress={onClearSearch}
                style={styles.resultsClearBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={13} color="#071421" />
                <Text style={styles.resultsClearBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Active Filter Status — ONLY displayed when a specific filter is active */}
        {hasActiveFilter && (
          <View style={styles.activeFilterRow}>
            <View style={styles.filterLabelContainer}>
              <Text style={[styles.activeFilterLabel, { color: isDark ? '#CBD5E1' : '#475467' }]}>
                Filtered by:{' '}
                <Text style={styles.activeFilterBold}>{activeCategoryTitle}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onSelectCategory('all')}
              style={styles.clearFilterButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Show all categories"
            >
              <Ionicons name="close-circle" size={14} color="#071421" />
              <Text style={styles.clearFilterText}>Show All Categories</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2-Column Responsive Grid with Equal Widths & Zero Trailing Empty Space */}
        <View style={styles.gridContainer}>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <View
                key={`row-${rowIndex}`}
                style={[
                  styles.gridRow,
                  rowIndex === rows.length - 1 && styles.gridRowLast,
                ]}
              >
                {row.map((cat) => (
                  <View key={cat.id} style={styles.gridCol}>
                    <CategoryCard
                      category={cat}
                      isSelected={selectedCategory === cat.id}
                      onPress={handleCardPress}
                      width="100%"
                    />
                  </View>
                ))}

                {/* Pad incomplete row with an invisible equal-flex column so left card stays at 50% */}
                {Array.from({ length: numColumns - row.length }).map((_, emptyIndex) => (
                  <View key={`empty-${emptyIndex}`} style={styles.gridCol} />
                ))}
              </View>
            ))
          ) : (
            <View style={styles.noCategoriesMatch}>
              <View style={styles.noMatchIconCircle}>
                <Ionicons name="search-outline" size={24} color="#FFB900" />
              </View>
              <Text style={[styles.noCatTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                No categories match "{searchFilter}"
              </Text>
              <Text style={[styles.noCatSub, { color: isDark ? '#94A3B8' : '#667085' }]}>
                Try searching for Weddings, Sports, Birthdays, Concerts, or Corporate.
              </Text>
              {onClearSearch && (
                <TouchableOpacity
                  onPress={onClearSearch}
                  style={styles.noMatchResetBtn}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search and view all categories"
                >
                  <Ionicons name="refresh" size={14} color="#071421" />
                  <Text style={styles.noMatchResetBtnText}>Clear Search & View All</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 22, // Balanced 20–24px spacing directly below search bar
    paddingBottom: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 1080,
    borderRadius: 20, // Clean rounded outer container
    borderWidth: 1.5, // Thin, elegant gold border
    padding: 16,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  brandIconBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFB900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FFB900',
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subHeading: {
    fontSize: 13.5,
    lineHeight: 18,
    marginTop: 4,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterLabelContainer: {
    flex: 1,
    minWidth: 130,
  },
  activeFilterLabel: {
    fontSize: 12.5,
  },
  activeFilterBold: {
    fontWeight: '700',
    color: '#FFB900',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB900',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 5,
  },
  clearFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#071421',
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  gridRowLast: {
    marginBottom: 0,
  },
  gridCol: {
    flex: 1,
    minWidth: 0,
  },
  noCategoriesMatch: {
    width: '100%',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noCatTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  noCatSub: {
    fontSize: 12.5,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 17,
  },
  searchResultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 185, 0, 0.08)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 0, 0.2)',
  },
  searchResultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  searchResultsText: {
    fontSize: 12.5,
  },
  resultsCountBold: {
    fontWeight: '800',
    color: '#FFB900',
  },
  resultsQueryBold: {
    fontWeight: '700',
  },
  resultsClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB900',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  resultsClearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#071421',
  },
  noMatchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  noMatchResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB900',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  noMatchResetBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#071421',
  },
});
