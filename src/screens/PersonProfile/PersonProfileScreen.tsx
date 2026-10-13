import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { MemoryPerson, MemoryPhotoItem, Memory } from '../../types/memory';
import { Photo } from '../../types/photo';
import { MemoriesService } from '../../services/memoriesService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { LocalPhotoViewerModal } from '../../components/LocalPhotoViewerModal';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const PADDING = 16;
const ITEM_SIZE = (SCREEN_WIDTH - PADDING * 2 - GRID_GAP) / 2;

export const PersonProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { personId } = route.params;
  const { user } = useAuth();
  const userId = user?.id || 'demo_user';
  const { isDark } = useTheme();

  const [person, setPerson] = useState<MemoryPerson | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [photos, setPhotos] = useState<MemoryPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MemoriesService.getPersonDetails(userId, personId);
      setPerson(res.person);
      setMemories(res.memories);
      setPhotos(res.photos);
    } catch (err) {
      console.error('[PersonProfileScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, personId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color="#FFB900" />
        <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#667085' }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!person) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
        <Ionicons name="person-circle-outline" size={48} color="#94A3B8" />
        <Text style={[styles.errorTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Person Not Found
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHomeBtn}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContentWrapper}>
      {/* Profile Card */}
      <View
        style={[
          styles.profileHero,
          {
            backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
            borderColor: isDark ? '#1C2F45' : '#E4E7EC',
          },
        ]}
      >
        <View style={styles.avatarLargeWrapper}>
          {person.avatarUrl ? (
            <Image source={{ uri: person.avatarUrl }} style={styles.avatarLargeImg} />
          ) : (
            <View style={styles.avatarLargeFallback}>
              <Text style={styles.avatarLargeFallbackText}>
                {person.initials || person.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          {person.name}
        </Text>

        {person.role ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{person.role}</Text>
          </View>
        ) : null}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              {memories.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
              {memories.length === 1 ? 'Memory' : 'Memories'}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? '#1C2F45' : '#E4E7EC' }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              {photos.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
              {photos.length === 1 ? 'Photo' : 'Photos'}
            </Text>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNoteBox}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={styles.privacyNoteText}>
            Only authorized photos from shared memories with {person.name} are shown.
          </Text>
        </View>
      </View>

      {/* Associated Memories List */}
      {memories.length > 0 && (
        <View style={styles.memoriesSection}>
          <Text style={[styles.sectionHeading, { color: isDark ? '#FFFFFF' : '#101828' }]}>
            Shared Memories
          </Text>
          <FlatList
            data={memories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.memoriesScrollRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('MemoryDetails', { memoryId: item.id })}
                style={[
                  styles.miniMemoryCard,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : item.themeColor?.background || '#F8FAFC',
                    borderColor: isDark ? '#1C2F45' : item.themeColor?.border || '#E4E7EC',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.miniMemoryTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.miniMemoryDate, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  {item.dateRange}
                </Text>
                <Text style={[styles.miniMemoryCount, { color: '#FFB900' }]}>
                  {item.photos.length} photos
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Photos Grid Header */}
      <View style={styles.photosGridHeader}>
        <Text style={[styles.sectionHeading, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Photos with {person.name}
        </Text>
        <Text style={[styles.photosGridCount, { color: isDark ? '#94A3B8' : '#667085' }]}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#071421' : '#FFFFFF',
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20),
        },
      ]}
    >
      {/* Top Navbar */}
      <View style={[styles.navbar, { borderBottomColor: isDark ? '#1C2F45' : '#E4E7EC' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navBackBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          {person.name}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedPhotoIndex(index);
              setViewerVisible(true);
            }}
            activeOpacity={0.88}
            style={styles.photoGridCard}
          >
            <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={44} color="#FFB900" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              No Photos Found
            </Text>
            <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#667085' }]}>
              There are currently no photos tagged with {person.name}.
            </Text>
          </View>
        }
      />

      {/* Full screen photo viewer */}
      <LocalPhotoViewerModal
        visible={viewerVisible}
        photos={photos.map((p) => ({
          id: p.id,
          uri: p.uri,
          mediaType: 'photo',
          width: p.width || 1200,
          height: p.height || 1200,
          creationTime: Date.now(),
        }))}
        initialIndex={selectedPhotoIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 16,
  },
  backHomeBtn: {
    backgroundColor: '#FFB900',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  backHomeBtnText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 14,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  navBackBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: PADDING,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  headerContentWrapper: {
    marginBottom: 16,
  },
  profileHero: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarLargeWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFB900',
    marginBottom: 12,
  },
  avatarLargeImg: {
    width: '100%',
    height: '100%',
  },
  avatarLargeFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeFallbackText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#071421',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 185, 0, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: {
    color: '#FFB900',
    fontSize: 11,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  privacyNoteText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  memoriesSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  memoriesScrollRow: {
    gap: 10,
  },
  miniMemoryCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: 140,
    justifyContent: 'space-between',
  },
  miniMemoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  miniMemoryDate: {
    fontSize: 11,
    marginBottom: 6,
  },
  miniMemoryCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  photosGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  photosGridCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  photoGridCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
});
