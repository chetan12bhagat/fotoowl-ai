import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { Memory, MemoryPerson } from '../../types/memory';
import { PHOTO_CATEGORIES } from '../../constants/categories';
import { BrandedHeader } from '../../components/BrandedHeader';
import { SearchBar } from '../../components/SearchBar';
import { EmptyState } from '../../components/EmptyState';
import { MemoryFilterRow } from '../../components/MemoryFilterRow';
import { MemoryCard } from '../../components/MemoryCard';
import { AddMemoryTile } from '../../components/AddMemoryTile';
import { PeopleRow } from '../../components/PeopleRow';
import { CreateMemoryModal } from '../../components/CreateMemoryModal';
import { AllPeopleModal } from '../../components/AllPeopleModal';
import { useMemories } from '../../hooks/useMemories';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  // Memories custom hook
  const {
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
    toggleFavorite,
    refresh,
  } = useMemories();

  // Modal visibility states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [allPeopleModalVisible, setAllPeopleModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Navigate to Memory Details
  const handleMemoryPress = useCallback(
    (memory: Memory) => {
      navigation.navigate('MemoryDetails', { memoryId: memory.id });
    },
    [navigation]
  );

  // Navigate to Person Profile
  const handlePersonPress = useCallback(
    (person: MemoryPerson) => {
      navigation.navigate('PersonProfile', { personId: person.id });
    },
    [navigation]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#071421' : '#F8FAFC' },
      ]}
    >
      {/* 1. Header with FotoOwl.AI Logo, Notifications, and Profile Avatar */}
      <BrandedHeader
        showLogo
        rightComponent={
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Notifications',
                  'You have 2 new event updates: "Christmas Party" photos were synced, and "Wedding Memories" album was shared.'
                )
              }
              style={[
                styles.headerIconBtn,
                {
                  backgroundColor: isDark ? '#1C2F45' : '#F2F4F7',
                  borderColor: isDark ? '#263E5A' : '#E4E7EC',
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={isDark ? '#FFFFFF' : '#101828'}
              />
              <View style={styles.headerNotifBadge} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (navigation as any).navigate('ProfileTab')}
              style={[
                styles.headerAvatarBtn,
                {
                  borderColor: user?.avatarUri ? '#FFB900' : isDark ? '#1C2F45' : '#E4E7EC',
                  backgroundColor: isDark ? '#102235' : '#F2F4F7',
                },
              ]}
              activeOpacity={0.8}
              accessibilityLabel="View Profile and Settings"
            >
              {user?.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.headerAvatarImg} />
              ) : (
                <Ionicons
                  name="person"
                  size={15}
                  color={isDark ? '#94A3B8' : '#667085'}
                />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Platform.select({ ios: 110, android: 96, default: 90 }),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFB900"
            colors={['#FFB900']}
          />
        }
      >
        {/* Search Bar for searching memories, dates, people, or events */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search memories, dates, or people..."
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        {/* 2. Horizontal Filter Row for All Memories, My Memories, Shared Memories, Favorites */}
        <MemoryFilterRow
          activeFilter={filter}
          onSelectFilter={setFilter}
          counts={counts}
        />

        {/* 3. Featured Memories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleCol}>
              <View style={styles.sectionHeadingBadge}>
                <Ionicons name="sparkles" size={14} color="#FFB900" style={{ marginRight: 5 }} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Featured Memories
                </Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: isDark ? '#94A3B8' : '#667085' }]}>
                {filter === 'favorites'
                  ? 'Your starred milestones & celebrations'
                  : filter === 'shared'
                  ? 'Moments shared with loved ones'
                  : filter === 'my'
                  ? 'Your private event collections'
                  : 'Your treasured life milestones & events'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              style={styles.quickAddHeaderBtn}
              activeOpacity={0.7}
              accessibilityLabel="Add new memory"
            >
              <Ionicons name="add" size={18} color="#071421" />
              <Text style={styles.quickAddHeaderText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Add Memory Tile */}
          <AddMemoryTile onPress={() => setCreateModalVisible(true)} />

          {/* Loading Indicator */}
          {loading && memories.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFB900" />
              <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                Loading your memories dashboard...
              </Text>
            </View>
          ) : filteredMemories.length === 0 ? (
            /* Empty State */
            <EmptyState
              icon={
                filter === 'favorites'
                  ? 'heart-outline'
                  : filter === 'shared'
                  ? 'people-outline'
                  : 'albums-outline'
              }
              title={
                searchQuery
                  ? 'No Matching Memories'
                  : filter === 'favorites'
                  ? 'No Favorite Memories'
                  : filter === 'shared'
                  ? 'No Shared Memories'
                  : 'No Memories Yet'
              }
              description={
                searchQuery
                  ? `No memories match "${searchQuery}". Try another keyword or date.`
                  : filter === 'favorites'
                  ? 'Tap the heart icon on any memory card to add it to your favorites.'
                  : 'Create your first memory to preserve vacations, birthdays, and celebrations.'
              }
              actionTitle={searchQuery ? 'Clear Search' : 'Create Memory'}
              actionIcon="add-circle-outline"
              onAction={() => {
                if (searchQuery) {
                  setSearchQuery('');
                  setFilter('all');
                } else {
                  setCreateModalVisible(true);
                }
              }}
            />
          ) : (
            /* Memories Cards List */
            <View style={styles.cardsList}>
              {filteredMemories.map((mem) => (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  onPress={handleMemoryPress}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </View>
          )}
        </View>

        {/* 4. People Section */}
        <PeopleRow
          people={people}
          onSelectPerson={handlePersonPress}
          onViewAll={() => setAllPeopleModalVisible(true)}
        />

        {/* 5. Browse Event Categories Section (preserving category exploration) */}
        <View style={styles.categoriesSection}>
          <View style={styles.catSectionHeader}>
            <Text style={[styles.catSectionTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Explore by Event Category
            </Text>
            <Text style={[styles.catSectionSub, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Curated collections for all occasions
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScrollList}
          >
            {PHOTO_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  setSearchQuery(cat.title);
                }}
                activeOpacity={0.8}
                style={[
                  styles.categoryPillCard,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                    borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  },
                ]}
              >
                <Ionicons name="folder-outline" size={16} color="#FFB900" style={{ marginRight: 6 }} />
                <Text style={[styles.categoryPillTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  {cat.title}
                </Text>
                <Text style={[styles.categoryPillCount, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  {cat.countLabel || 'Moments'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Create Memory Modal */}
      <CreateMemoryModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={createMemory}
        availablePeople={people}
      />

      {/* All People Modal */}
      <AllPeopleModal
        visible={allPeopleModalVisible}
        onClose={() => setAllPeopleModalVisible(false)}
        people={people}
        onSelectPerson={handlePersonPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleCol: {
    flex: 1,
  },
  sectionHeadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  quickAddHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB900',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 2,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  quickAddHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071421',
  },
  cardsList: {
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  categoriesSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  catSectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  catSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  catSectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  catScrollList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  categoryPillTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryPillCount: {
    fontSize: 11,
    marginLeft: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerNotifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFB900',
  },
  headerAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
});

