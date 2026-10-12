import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Photo, PhotoFilter } from '../../types/photo';
import { BrandedHeader } from '../../components/BrandedHeader';
import { SearchBar } from '../../components/SearchBar';
import { FilterSelector } from '../../components/FilterSelector';
import { PhotoCard } from '../../components/PhotoCard';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { usePhotos } from '../../hooks/usePhotos';
import { useDebounce } from '../../hooks/useDebounce';
import { useTheme } from '../../hooks/useTheme';
import { filterPhotos } from '../../utils/formatters';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const {
    photos,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = usePhotos();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('all');

  // Debounced search for smooth rendering
  const debouncedSearch = useDebounce(searchQuery, 250);

  // Compute filtered view without mutating underlying photo collection
  const filteredPhotos = useMemo(() => {
    return filterPhotos(photos, debouncedSearch, activeFilter);
  }, [photos, debouncedSearch, activeFilter]);

  const handlePhotoPress = useCallback((photo: Photo) => {
    navigation.navigate('ImageDetails', { photo });
  }, [navigation]);

  const renderPhotoItem = useCallback(
    ({ item }: { item: Photo }) => (
      <PhotoCard photo={item} onPress={handlePhotoPress} />
    ),
    [handlePhotoPress]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
          Loading more moments...
        </Text>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;

    if (photos.length === 0) {
      return (
        <EmptyState
          icon="camera-outline"
          title="No Photos Available"
          description="We couldn't load any photos right now. Please pull down to refresh."
          actionTitle="Refresh Feed"
          onAction={refresh}
        />
      );
    }

    return (
      <EmptyState
        icon="search-outline"
        title="No Matching Photos"
        description={`No photographers match "${debouncedSearch}" in filter "${activeFilter}".`}
        actionTitle="Clear Filters"
        onAction={() => {
          setSearchQuery('');
          setActiveFilter('all');
        }}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Branded Header */}
      <BrandedHeader showLogo />

      {/* Search and Filters Header Section */}
      <View style={[styles.filterBar, { backgroundColor: theme.colors.surface }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by photographer name..."
        />
        <FilterSelector
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          allCount={photos.length}
        />
      </View>

      {/* Main Content Area */}
      {loading && photos.length === 0 ? (
        <LoadingIndicator message="Connecting to FotoOwl gallery..." />
      ) : error && photos.length === 0 ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={filteredPhotos}
          keyExtractor={(item) => item.id}
          renderItem={renderPhotoItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            // Only trigger infinite scrolling if no search filter is actively narrowing results
            if (!debouncedSearch && activeFilter === 'all' && hasMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
  },
});
