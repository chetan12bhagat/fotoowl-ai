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
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types/navigation';
import { Memory, MemoryPhotoItem } from '../../types/memory';
import { Photo } from '../../types/photo';
import { MemoriesService } from '../../services/memoriesService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { LocalPhotoViewerModal } from '../../components/LocalPhotoViewerModal';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoryDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const PADDING = 16;
const ITEM_SIZE = (SCREEN_WIDTH - PADDING * 2 - GRID_GAP) / 2;

export const MemoryDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { memoryId } = route.params;
  const { user } = useAuth();
  const userId = user?.id || 'demo_user';
  const { theme, isDark } = useTheme();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const loadMemory = useCallback(async () => {
    setLoading(true);
    try {
      const memories = await MemoriesService.getMemories(userId);
      const found = memories.find((m) => m.id === memoryId) || null;
      setMemory(found);
    } catch (err) {
      console.error('[MemoryDetailsScreen] Error loading memory:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, memoryId]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const handleToggleFavorite = async () => {
    if (!memory) return;
    const newStatus = await MemoriesService.toggleFavorite(userId, memory.id);
    setMemory((prev) => (prev ? { ...prev, isFavorite: newStatus } : null));
  };

  const handleDeleteMemory = async () => {
    if (!memory) return;
    setDeleteDialogVisible(false);
    const ok = await MemoriesService.deleteMemory(userId, memory.id);
    if (ok) {
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Could not delete this memory.');
    }
  };

  const handleShareMemory = async () => {
    if (!memory) return;
    try {
      await Share.share({
        title: memory.title,
        message: `Check out our memory "${memory.title}" (${memory.dateRange}) on FotoOwl.AI with ${memory.photos.length} photos!`,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleAddPhotos = async () => {
    if (!memory) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: MemoryPhotoItem[] = result.assets.map((asset, index) => ({
          id: `local_${Date.now()}_${index}`,
          uri: asset.uri,
          thumbnailUri: asset.uri,
          title: asset.fileName || `Photo ${Date.now()}`,
          source: 'device',
          dateAdded: new Date().toISOString(),
          width: asset.width || 1200,
          height: asset.height || 1200,
        }));

        const updated = await MemoriesService.addPhotosToMemory(userId, memory.id, newItems);
        if (updated) {
          setMemory(updated);
          Alert.alert('Photos Added', `${newItems.length} photos added to "${memory.title}".`);
        }
      }
    } catch (err) {
      Alert.alert('Picker Notice', 'Could not open photo library.');
    }
  };

  const handlePhotoPress = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const handleOpenPhotoDetails = (photoItem: MemoryPhotoItem) => {
    const photoAdapter: Photo = {
      id: photoItem.id,
      author: memory?.title || 'FotoOwl Memory',
      url: photoItem.uri,
      download_url: photoItem.uri,
      width: photoItem.width || 1200,
      height: photoItem.height || 1200,
      title: photoItem.title || memory?.title,
      event: memory?.title,
      album: memory?.category,
    };
    navigation.navigate('ImageDetails', { photo: photoAdapter });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color="#FFB900" />
        <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#667085' }]}>
          Loading memory details...
        </Text>
      </View>
    );
  }

  if (!memory) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.errorTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Memory Not Found
        </Text>
        <Text style={[styles.errorSub, { color: isDark ? '#94A3B8' : '#667085' }]}>
          This memory may have been removed or is inaccessible.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backHomeBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cardBg = isDark ? '#0D1F31' : memory.themeColor?.background || '#FFFBEB';
  const cardBorder = isDark ? '#1C2F45' : memory.themeColor?.border || '#FDE68A';
  const badgeBg = isDark ? 'rgba(255, 185, 0, 0.15)' : memory.themeColor?.badgeBg || '#FEF3C7';
  const badgeText = isDark ? '#FFB900' : memory.themeColor?.badgeText || '#B45309';

  const renderHeader = () => (
    <View style={styles.headerContentWrapper}>
      {/* Hero Memory Card */}
      <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.heroTopRow}>
          {memory.category && (
            <View style={[styles.categoryBadge, { backgroundColor: badgeBg }]}>
              <Ionicons name="sparkles" size={11} color={badgeText} style={{ marginRight: 4 }} />
              <Text style={[styles.categoryBadgeText, { color: badgeText }]}>
                {memory.category.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={12} color={isDark ? '#94A3B8' : '#667085'} style={{ marginRight: 4 }} />
            <Text style={[styles.datePillText, { color: isDark ? '#94A3B8' : '#667085' }]}>
              {memory.dateRange}
            </Text>
          </View>
        </View>

        <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          {memory.title}
        </Text>

        {memory.description ? (
          <Text style={[styles.heroDesc, { color: isDark ? '#CBD5E1' : '#475467' }]}>
            {memory.description}
          </Text>
        ) : null}

        {/* Tagged People */}
        {memory.people && memory.people.length > 0 && (
          <View style={styles.heroPeopleRow}>
            <Text style={[styles.peopleLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
              With:
            </Text>
            <View style={styles.peopleChips}>
              {memory.people.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  onPress={() => navigation.navigate('PersonProfile', { personId: person.id })}
                  style={[styles.personChip, { backgroundColor: isDark ? '#1C2F45' : '#FFFFFF' }]}
                  activeOpacity={0.75}
                >
                  {person.avatarUrl ? (
                    <Image source={{ uri: person.avatarUrl }} style={styles.chipAvatar} />
                  ) : null}
                  <Text style={[styles.chipName, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                    {person.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleAddPhotos}
            style={styles.addPhotosActionBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#071421" style={{ marginRight: 6 }} />
            <Text style={styles.addPhotosActionBtnText}>Add Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShareMemory}
            style={[styles.secondaryActionBtn, { borderColor: isDark ? '#1C2F45' : '#D0D5DD' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={16} color={isDark ? '#FFFFFF' : '#101828'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDeleteDialogVisible(true)}
            style={[styles.secondaryActionBtn, { borderColor: '#FCA5A5' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid Meta Header */}
      <View style={styles.gridMetaRow}>
        <Text style={[styles.gridSectionTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Memory Photos
        </Text>
        <Text style={[styles.gridCountText, { color: isDark ? '#94A3B8' : '#667085' }]}>
          {memory.photos.length} {memory.photos.length === 1 ? 'photo' : 'photos'}
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

        <Text
          style={[styles.navTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}
          numberOfLines={1}
        >
          {memory.title}
        </Text>

        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.navRightBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={memory.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={memory.isFavorite ? '#E11D48' : isDark ? '#FFFFFF' : '#101828'}
          />
        </TouchableOpacity>
      </View>

      {/* Photos Grid */}
      <FlatList
        data={memory.photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => handlePhotoPress(index)}
            onLongPress={() => handleOpenPhotoDetails(item)}
            activeOpacity={0.88}
            style={styles.photoGridCard}
          >
            <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />
            <View style={styles.sourcePill}>
              <Ionicons
                name={item.source === 'device' ? 'phone-portrait' : 'cloud'}
                size={10}
                color="#FFFFFF"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.sourcePillText}>
                {item.source === 'device' ? 'Device' : 'Cloud'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={44} color="#FFB900" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              No Photos in this Memory
            </Text>
            <Text style={[styles.emptySub, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Add photos from your device to preserve this special moment.
            </Text>
            <TouchableOpacity onPress={handleAddPhotos} style={styles.addPhotosEmptyBtn}>
              <Text style={styles.addPhotosEmptyBtnText}>Add Photos Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Memory"
        message={`Are you sure you want to delete "${memory.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteMemory}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      {/* Full screen photo viewer */}
      <LocalPhotoViewerModal
        visible={viewerVisible}
        photos={memory.photos.map((p) => ({
          id: p.id,
          uri: p.uri,
          mediaType: 'photo',
          width: p.width || 1200,
          height: p.height || 1200,
          creationTime: Date.now(),
        }))}
        initialIndex={viewerIndex}
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
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
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
    paddingHorizontal: 10,
  },
  navRightBtn: {
    padding: 6,
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
  heroCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroPeopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  peopleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  peopleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
  },
  chipAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addPhotosActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB900',
    paddingVertical: 10,
    borderRadius: 14,
  },
  addPhotosActionBtnText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  gridMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  gridCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  photoGridCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  sourcePill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 20, 33, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  sourcePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
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
    maxWidth: 260,
  },
  addPhotosEmptyBtn: {
    backgroundColor: '#FFB900',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  addPhotosEmptyBtnText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 14,
  },
});
