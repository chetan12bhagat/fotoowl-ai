import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshControl,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import {
  LocalPhotoViewerModal,
  DeviceMediaItem,
} from '../../components/LocalPhotoViewerModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'All' | 'Photos' | 'Videos' | 'Recent';
type PermissionState = 'checking' | 'granted' | 'limited' | 'denied' | 'undetermined';

const PAGE_SIZE = 36;

export const GalleryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // Primary states
  const [photos, setPhotos] = useState<DeviceMediaItem[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState>('checking');
  const [accessPrivileges, setAccessPrivileges] = useState<'all' | 'limited' | 'none'>('none');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Full screen viewer states
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Reference to track active user ID and cancel obsolete requests
  const activeUserIdRef = useRef<string | undefined>(user?.id);
  const isFetchingRef = useRef<boolean>(false);

  // Isolate web storage per authenticated user
  const webStorageKey = `@fotoowl_web_photos_user_${user?.id || 'guest'}`;

  /**
   * STRICT USER PRIVACY RULE:
   * When authenticated user changes (or logs out), immediately clear
   * all in-memory photos, thumbnails, and viewer states.
   */
  useEffect(() => {
    activeUserIdRef.current = user?.id;
    // Clear all previous account data from memory
    setPhotos([]);
    setEndCursor(undefined);
    setHasNextPage(false);
    setTotalCount(0);
    setViewerVisible(false);
    setSelectedPhotoIndex(0);

    // Re-check permissions and reload fresh photos for this user session
    checkPermissionsAndFetch(true);
  }, [user?.id]);

  /**
   * Listen to AppState changes (e.g. user toggles permissions in iOS Settings or photo picker)
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && Platform.OS !== 'web') {
        checkPermissionsAndFetch(false);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  /**
   * Native MediaLibrary listener for inserted/deleted assets
   */
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let mediaLibSub: { remove: () => void } | null = null;
    try {
      mediaLibSub = MediaLibrary.addListener(() => {
        // Re-load initial assets if library contents changed on device
        fetchInitialAssets();
      });
    } catch {
      // Listener might not be supported on all environments
    }

    return () => {
      if (mediaLibSub) {
        mediaLibSub.remove();
      }
    };
  }, []);

  /**
   * Check operating system photo-library permissions
   */
  const checkPermissionsAndFetch = async (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoadingInitial(true);
    }

    try {
      if (Platform.OS === 'web') {
        // Web platform: Explain sandbox and load user-specific cached selections
        setPermissionState('granted');
        setAccessPrivileges('limited');
        await loadWebPhotos();
        return;
      }

      // Check current native permission
      const response = await MediaLibrary.getPermissionsAsync();

      if (response.granted) {
        const isLimited = response.accessPrivileges === 'limited';
        setPermissionState(isLimited ? 'limited' : 'granted');
        setAccessPrivileges(response.accessPrivileges || 'all');
        await fetchInitialAssets();
      } else if (response.status === 'undetermined') {
        setPermissionState('undetermined');
        setAccessPrivileges('none');
      } else {
        setPermissionState('denied');
        setAccessPrivileges('none');
      }
    } catch (error) {
      console.error('[GalleryScreen] Error checking permissions:', error);
      setPermissionState('denied');
    } finally {
      setIsLoadingInitial(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Request operating system permissions
   */
  const handleRequestPermission = async () => {
    if (Platform.OS === 'web') {
      handlePickPhotosFromDevice();
      return;
    }

    try {
      setIsLoadingInitial(true);
      const response = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);

      if (response.granted) {
        const isLimited = response.accessPrivileges === 'limited';
        setPermissionState(isLimited ? 'limited' : 'granted');
        setAccessPrivileges(response.accessPrivileges || 'all');
        await fetchInitialAssets();
      } else if (response.status === 'denied' || !response.canAskAgain) {
        setPermissionState('denied');
        setAccessPrivileges('none');
        Alert.alert(
          'Photo Permission Needed',
          'FotoOwl needs permission to access your photo library. Please enable it in Settings to view your photos.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        setPermissionState('denied');
      }
    } catch (err: any) {
      console.error('[GalleryScreen] Request permission error:', err);
      Alert.alert('Permission Error', err?.message || 'Could not request photo library permissions.');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  /**
   * Present limited permissions picker on iOS 14+ / Android 14+
   */
  const handleManageLimitedPermissions = async () => {
    if (Platform.OS === 'web') {
      handlePickPhotosFromDevice();
      return;
    }

    try {
      if (typeof MediaLibrary.presentPermissionsPickerAsync === 'function') {
        await MediaLibrary.presentPermissionsPickerAsync(['photo', 'video']);
        // Refresh after picker returns
        await fetchInitialAssets();
      } else {
        Linking.openSettings();
      }
    } catch (err: any) {
      console.error('[GalleryScreen] presentPermissionsPickerAsync error:', err);
      Linking.openSettings();
    }
  };

  /**
   * Fetch initial page of assets from device library
   */
  const fetchInitialAssets = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (Platform.OS === 'web') {
        await loadWebPhotos();
        return;
      }

      // Enumerate device media: photos and videos, newest first
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // Newest first
      });

      // Verify that the user did not switch accounts while query was executing
      if (activeUserIdRef.current !== user?.id) {
        return;
      }

      const formatted: DeviceMediaItem[] = result.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
        mediaType: a.mediaType === 'video' ? 'video' : 'photo',
        width: a.width || 1200,
        height: a.height || 1200,
        creationTime: a.creationTime,
        duration: a.duration,
      }));

      setPhotos(formatted);
      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      console.error('[GalleryScreen] Error fetching assets:', err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  /**
   * Paginate more assets as user scrolls down
   */
  const handleLoadMore = async () => {
    if (!hasNextPage || isLoadingMore || !endCursor || isFetchingRef.current || Platform.OS === 'web') {
      return;
    }

    try {
      setIsLoadingMore(true);
      isFetchingRef.current = true;

      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: endCursor,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      if (activeUserIdRef.current !== user?.id) {
        return;
      }

      const formatted: DeviceMediaItem[] = result.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        filename: a.filename,
        mediaType: a.mediaType === 'video' ? 'video' : 'photo',
        width: a.width || 1200,
        height: a.height || 1200,
        creationTime: a.creationTime,
        duration: a.duration,
      }));

      setPhotos((prev) => [...prev, ...formatted]);
      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (err) {
      console.error('[GalleryScreen] Error loading more assets:', err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  /**
   * Web platform: load photos saved in user-specific isolated storage
   */
  const loadWebPhotos = async () => {
    try {
      const stored = await AsyncStorage.getItem(webStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPhotos(parsed);
          setTotalCount(parsed.length);
          return;
        }
      }
      setPhotos([]);
      setTotalCount(0);
    } catch {
      setPhotos([]);
    }
  };

  /**
   * Pick photos explicitly from device (useful on Web and for selecting extra items)
   */
  const handlePickPhotosFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 50,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: DeviceMediaItem[] = result.assets.map((asset, index) => ({
          id: `local-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          uri: asset.uri,
          filename: asset.fileName || `Photo_${Date.now()}_${index}`,
          mediaType: asset.type === 'video' ? 'video' : 'photo',
          width: asset.width || 1200,
          height: asset.height || 1200,
          creationTime: Date.now(),
          duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
        }));

        const updated = [...newItems, ...photos];
        setPhotos(updated);
        setTotalCount(updated.length);

        // On web, persist to user-isolated storage
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem(webStorageKey, JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('[GalleryScreen] Photo picker error:', error);
      Alert.alert('Picker Error', 'Could not open photo picker.');
    }
  };

  /**
   * Pull-to-refresh handler
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkPermissionsAndFetch(false);
    setIsRefreshing(false);
  };

  /**
   * Delete photo safely via authorized platform API
   */
  const handleDeletePhoto = async (photoId: string): Promise<boolean> => {
    try {
      if (Platform.OS !== 'web') {
        const success = await MediaLibrary.deleteAssetsAsync([photoId]);
        if (!success) {
          Alert.alert('Notice', 'Photo could not be deleted from device library.');
          return false;
        }
      }

      // Remove from state
      const updated = photos.filter((p) => p.id !== photoId);
      setPhotos(updated);
      setTotalCount(updated.length);

      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(webStorageKey, JSON.stringify(updated));
      }

      return true;
    } catch (err: any) {
      console.error('[GalleryScreen] Delete error:', err);
      Alert.alert('Delete Error', err?.message || 'Could not delete photo.');
      return false;
    }
  };

  /**
   * Handle photo item press - open full-screen viewer
   */
  const handlePhotoPress = useCallback((index: number) => {
    setSelectedPhotoIndex(index);
    setViewerVisible(true);
  }, []);

  /**
   * Filtered photo list according to active filter
   */
  const displayedPhotos = React.useMemo(() => {
    if (activeFilter === 'Photos') {
      return photos.filter((p) => p.mediaType !== 'video');
    }
    if (activeFilter === 'Videos') {
      return photos.filter((p) => p.mediaType === 'video');
    }
    if (activeFilter === 'Recent') {
      return [...photos].sort((a, b) => b.creationTime - a.creationTime).slice(0, 18);
    }
    return photos;
  }, [photos, activeFilter]);

  // Sizing for 3-column responsive grid
  const screenWidth = Dimensions.get('window').width;
  const GAP = 6;
  const PADDING = 16;
  const itemSize = Math.floor((Math.min(screenWidth, 640) - PADDING * 2 - GAP * 2) / 3);

  // Format video duration
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * Render Header Content
   */
  const renderHeader = () => (
    <View style={styles.headerContentWrapper}>
      {/* Top Navigation Row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#101828'}
          />
        </TouchableOpacity>

        <View style={styles.titleColumn}>
          <Text style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
            My Gallery
          </Text>
          <Text style={[styles.subTitle, { color: isDark ? '#94A3B8' : '#667085' }]}>
            {user ? `${user.fullName}'s Device Photos` : 'Your photos, all in one place.'}
          </Text>
        </View>

        {/* Privacy Pill */}
        <View style={styles.privacyIndicator}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.privacyIndicatorText}>100% Private</Text>
        </View>
      </View>

      {/* Limited Access Notice Banner if user granted partial library access */}
      {permissionState === 'limited' && Platform.OS !== 'web' && (
        <View style={styles.limitedBanner}>
          <View style={styles.limitedBannerTextCol}>
            <Text style={styles.limitedBannerTitle}>Selected Photos Mode</Text>
            <Text style={styles.limitedBannerSubtitle}>
              FotoOwl only has access to photos you authorized.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.manageAccessButton}
            onPress={handleManageLimitedPermissions}
            activeOpacity={0.8}
          >
            <Text style={styles.manageAccessButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Web Sandbox Informative Banner */}
      {Platform.OS === 'web' && (
        <View style={styles.webInfoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#FFB900" style={{ marginRight: 8 }} />
          <Text style={styles.webInfoBannerText}>
            Web Sandbox: Browsers require manual photo selection to protect device privacy.
          </Text>
        </View>
      )}

      {/* Prominent Gold Action Button */}
      <TouchableOpacity
        style={styles.selectPhotosButton}
        onPress={
          permissionState === 'limited' && Platform.OS !== 'web'
            ? handleManageLimitedPermissions
            : handlePickPhotosFromDevice
        }
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Select Photos from your device"
      >
        <Ionicons name="images-outline" size={20} color="#071421" style={{ marginRight: 8 }} />
        <Text style={styles.selectPhotosText}>
          {permissionState === 'limited' && Platform.OS !== 'web'
            ? 'Manage Selected Photos'
            : 'Select Photos from Device'}
        </Text>
      </TouchableOpacity>

      {/* Filter Row: All, Photos, Videos, Recent */}
      <View style={styles.filterRow}>
        <View style={styles.filterPillsGroup}>
          {(['All', 'Photos', 'Videos', 'Recent'] as const).map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
                style={[
                  styles.filterPill,
                  isSelected
                    ? styles.filterPillActive
                    : [
                        styles.filterPillInactive,
                        {
                          backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                          borderColor: isDark ? '#1C2F45' : '#E5E7EB',
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected
                      ? styles.filterPillTextActive
                      : { color: isDark ? '#94A3B8' : '#667085' },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.sortButton,
            {
              backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
              borderColor: isDark ? '#1C2F45' : '#E5E7EB',
            },
          ]}
          activeOpacity={0.75}
          onPress={() =>
            Alert.alert(
              'Library Privacy & Security',
              'Your device photos are read directly from your operating system photo library. They remain local on your device and are never automatically uploaded to any server.'
            )
          }
        >
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={isDark ? '#CBD5E1' : '#344054'}
          />
        </TouchableOpacity>
      </View>

      {/* Section Meta Row: "Photos on your device" and "X photos" */}
      <View style={styles.metaRow}>
        <Text style={[styles.metaTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Photos on your device
        </Text>
        <Text style={[styles.metaCount, { color: isDark ? '#94A3B8' : '#667085' }]}>
          {displayedPhotos.length} {displayedPhotos.length === 1 ? 'item' : 'items'}
          {totalCount > displayedPhotos.length ? ` (of ${totalCount})` : ''}
        </Text>
      </View>
    </View>
  );

  /**
   * Render individual grid item
   */
  const renderPhotoItem = ({ item, index }: { item: DeviceMediaItem; index: number }) => {
    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handlePhotoPress(index)}
        style={[
          styles.photoItemContainer,
          {
            width: itemSize,
            height: itemSize,
          },
        ]}
      >
        <Image source={{ uri: item.uri }} style={styles.photoImage} resizeMode="cover" />

        {/* Video indicator badge */}
        {isVideo && (
          <View style={styles.videoIndicatorBadge}>
            <Ionicons name="videocam" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
            {item.duration ? (
              <Text style={styles.videoDurationText}>{formatDuration(item.duration)}</Text>
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render Permission Denied State
   */
  const renderPermissionDenied = () => (
    <View style={styles.permissionPromptContainer}>
      <View style={styles.permissionIconCircle}>
        <Ionicons name="images" size={44} color="#FFB900" />
      </View>
      <Text style={[styles.permissionPromptTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
        Photo Library Access Needed
      </Text>
      <Text style={[styles.permissionPromptBody, { color: isDark ? '#94A3B8' : '#667085' }]}>
        To display your device photos in My Gallery, FotoOwl requires permission to read your photo
        library. Your photos remain 100% private on your device and are never automatically uploaded.
      </Text>
      <TouchableOpacity
        style={styles.openSettingsButton}
        onPress={() => Linking.openSettings()}
        activeOpacity={0.85}
      >
        <Ionicons name="settings-outline" size={18} color="#071421" style={{ marginRight: 8 }} />
        <Text style={styles.openSettingsButtonText}>Open System Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => checkPermissionsAndFetch(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.retryButtonText, { color: isDark ? '#FFB900' : '#071421' }]}>
          I've granted access, check again
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render Permission Undetermined State
   */
  const renderPermissionUndetermined = () => (
    <View style={styles.permissionPromptContainer}>
      <View style={styles.permissionIconCircle}>
        <Ionicons name="camera-reverse-outline" size={44} color="#FFB900" />
      </View>
      <Text style={[styles.permissionPromptTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
        Connect Your Photo Library
      </Text>
      <Text style={[styles.permissionPromptBody, { color: isDark ? '#94A3B8' : '#667085' }]}>
        Browse and organize your memories directly inside FotoOwl. You can choose full library access
        or select specific photos only.
      </Text>
      <TouchableOpacity
        style={styles.openSettingsButton}
        onPress={handleRequestPermission}
        activeOpacity={0.85}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color="#071421" style={{ marginRight: 8 }} />
        <Text style={styles.openSettingsButtonText}>Allow Photo Access</Text>
      </TouchableOpacity>
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
      {isLoadingInitial ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFB900" />
          <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#667085' }]}>
            Loading your device photos...
          </Text>
        </View>
      ) : permissionState === 'denied' ? (
        renderPermissionDenied()
      ) : permissionState === 'undetermined' ? (
        renderPermissionUndetermined()
      ) : (
        <FlatList
          data={displayedPhotos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={renderPhotoItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.select({ ios: 110, android: 96, default: 90 }) },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FFB900"
              colors={['#FFB900']}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#FFB900" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={48} color="#FFB900" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                No Photos Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#667085' }]}>
                {permissionState === 'limited'
                  ? 'No authorized photos match this filter. Tap "Manage Selected Photos" above to add more.'
                  : 'Your device photo library does not have any items matching this filter.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Full Screen Photo Viewer Modal */}
      <LocalPhotoViewerModal
        visible={viewerVisible}
        photos={displayedPhotos}
        initialIndex={selectedPhotoIndex}
        onClose={() => setViewerVisible(false)}
        onDeletePhoto={handleDeletePhoto}
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  headerContentWrapper: {
    width: '100%',
    paddingBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  titleColumn: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  privacyIndicatorText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  limitedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 0, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  limitedBannerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  limitedBannerTitle: {
    color: '#FFB900',
    fontSize: 13,
    fontWeight: '700',
  },
  limitedBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 1,
  },
  manageAccessButton: {
    backgroundColor: '#FFB900',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  manageAccessButtonText: {
    color: '#071421',
    fontSize: 12,
    fontWeight: '700',
  },
  webInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 185, 0, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  webInfoBannerText: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  selectPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#FFB900',
    borderRadius: 25,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  selectPhotosText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 15.5,
    letterSpacing: -0.1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  filterPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#FFB900',
    borderColor: '#FFB900',
  },
  filterPillInactive: {
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#071421',
    fontWeight: '700',
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 10,
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaCount: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  columnWrapper: {
    gap: 6,
    marginBottom: 6,
  },
  photoItemContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0B1C2A',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicatorBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionPromptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 185, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionPromptTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  permissionPromptBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  openSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#FFB900',
    borderRadius: 25,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  openSettingsButtonText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 15.5,
  },
  retryButton: {
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
