import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../types/navigation';
import { Photo } from '../../types/photo';
import { BrandedHeader } from '../../components/BrandedHeader';
import { SearchBar } from '../../components/SearchBar';
import { PhotoCard } from '../../components/PhotoCard';
import { EmptyState } from '../../components/EmptyState';
import { useFavorites } from '../../hooks/useFavorites';
import { useDebounce } from '../../hooks/useDebounce';
import { useTheme } from '../../hooks/useTheme';

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;
type TabNavProp = BottomTabNavigationProp<MainTabParamList>;

export const FavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const rootNavigation = useNavigation<RootNavProp>();
  const tabNavigation = useNavigation<TabNavProp>();
  const { favorites, favoritesCount } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  // Filter favorites by author name
  const filteredFavorites = useMemo(() => {
    if (!debouncedSearch.trim()) return favorites;
    const q = debouncedSearch.toLowerCase().trim();
    return favorites.filter((photo) =>
      (photo.author || '').toLowerCase().includes(q)
    );
  }, [favorites, debouncedSearch]);

  const handlePhotoPress = useCallback(
    (photo: Photo) => {
      rootNavigation.navigate('ImageDetails', { photo });
    },
    [rootNavigation]
  );

  const renderPhotoItem = useCallback(
    ({ item }: { item: Photo }) => (
      <PhotoCard photo={item} onPress={handlePhotoPress} />
    ),
    [handlePhotoPress]
  );

  const handleBrowsePhotos = () => {
    tabNavigation.navigate('HomeTab');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Branded Header */}
      <BrandedHeader
        title="Saved Favorites"
        subtitle={`${favoritesCount} curated ${favoritesCount === 1 ? 'photo' : 'photos'}`}
      />

      {/* Search Bar if user has favorited photos */}
      {favorites.length > 0 && (
        <View style={[styles.searchBarWrapper, { backgroundColor: theme.colors.surface }]}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved favorites by author..."
          />
        </View>
      )}

      {/* Favorites List */}
      <FlatList
        data={filteredFavorites}
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
              actionTitle="Browse Photos"
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
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
});
