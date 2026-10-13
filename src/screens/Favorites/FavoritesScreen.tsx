import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../../types/navigation';
import { Photo } from '../../types/photo';
import { BrandedHeader } from '../../components/BrandedHeader';
import { SearchBar } from '../../components/SearchBar';
import { PhotoCard } from '../../components/PhotoCard';
import { EmptyState } from '../../components/EmptyState';
import { useFavorites } from '../../hooks/useFavorites';
import { useDebounce } from '../../hooks/useDebounce';
import { useTheme } from '../../hooks/useTheme';
import { filterPhotos } from '../../utils/formatters';

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;
type TabNavProp = BottomTabNavigationProp<MainTabParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 10;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_SPACING) / 2;

export const FavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const rootNavigation = useNavigation<RootNavProp>();
  const tabNavigation = useNavigation<TabNavProp>();
  const { favorites, favoritesCount } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  // Filter favorites using unified search engine (author, ID, title, event, album)
  const filteredFavorites = useMemo(() => {
    return filterPhotos(favorites, debouncedSearch, 'all');
  }, [favorites, debouncedSearch]);

  const handlePhotoPress = useCallback(
    (photo: Photo) => {
      rootNavigation.navigate('ImageDetails', { photo });
    },
    [rootNavigation]
  );

  const renderPhotoItem = useCallback(
    ({ item }: { item: Photo }) => (
      <PhotoCard photo={item} onPress={handlePhotoPress} width={CARD_WIDTH} />
    ),
    [handlePhotoPress]
  );

  const handleBrowsePhotos = () => {
    tabNavigation.navigate('HomeTab');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Branded Header with Logo & Notification Bell matching Reference Image 1 */}
      <BrandedHeader
        showLogo
        showNotificationIcon
        onNotificationPress={() =>
          Alert.alert('Notifications', 'You have no new notifications from FotoOwl.AI.')
        }
      />

      {/* Subheader Title & Photo Count matching Reference Image 1 */}
      <View style={styles.headerTitleSection}>
        <Text style={[styles.mainHeading, { color: theme.colors.textPrimary }]}>
          My Favorites
        </Text>
        <View style={styles.countRow}>
          <Ionicons name="images-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
            {favoritesCount} {favoritesCount === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
      </View>

      {/* Search Bar if user has favorited photos */}
      {favorites.length > 0 && (
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search favorites..."
          />
        </View>
      )}

      {/* 2-Column Favorites List */}
      <FlatList
        key="fav_two_col_grid"
        data={filteredFavorites}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        keyExtractor={(item) => item.id}
        renderItem={renderPhotoItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          favorites.length === 0 ? (
            <EmptyState
              icon="heart-outline"
              title="No Favorites Yet"
              description="Explore the gallery and tap the heart icon on any photo to save it here."
              actionTitle="Browse Gallery"
              actionIcon="images-outline"
              onAction={handleBrowsePhotos}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No Matching Favorites"
              description={`No favorite photos found for "${debouncedSearch}".`}
              actionTitle="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 4,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchBarWrapper: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 10,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_SPACING,
  },
});
