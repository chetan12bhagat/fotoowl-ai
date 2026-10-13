import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library/legacy';

export interface DeviceMediaItem {
  id: string;
  uri: string;
  filename?: string;
  mediaType: 'photo' | 'video' | string;
  width: number;
  height: number;
  creationTime: number;
  duration?: number;
}

interface LocalPhotoViewerModalProps {
  visible: boolean;
  photos: DeviceMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onDeletePhoto?: (photoId: string) => Promise<boolean>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LocalPhotoViewerModal: React.FC<LocalPhotoViewerModalProps> = ({
  visible,
  photos,
  initialIndex,
  onClose,
  onDeletePhoto,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible && initialIndex >= 0 && initialIndex < photos.length) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex, photos.length]);

  if (!visible || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex] || photos[0];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Format creation timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recent';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  // Format duration for video
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle native sharing
  const handleShare = async () => {
    if (!currentPhoto?.uri) return;

    try {
      setIsSharing(true);

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: currentPhoto.filename || 'FotoOwl Device Photo',
            url: currentPhoto.uri,
          });
        } else {
          Alert.alert('Notice', 'Web direct sharing is not supported in this browser.');
        }
        return;
      }

      // Check if sharing is available on mobile
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
        return;
      }

      let shareUri = currentPhoto.uri;

      // On iOS, if URI is ph://, get local file URI from asset info
      if (Platform.OS === 'ios' && shareUri.startsWith('ph://')) {
        try {
          const info = await MediaLibrary.getAssetInfoAsync(currentPhoto.id);
          if (info.localUri) {
            shareUri = info.localUri;
          }
        } catch {
          // Fall back to currentPhoto.uri
        }
      }

      await Sharing.shareAsync(shareUri, {
        dialogTitle: 'Share Photo via FotoOwl.AI',
        mimeType: currentPhoto.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        UTI: currentPhoto.mediaType === 'video' ? 'public.movie' : 'public.jpeg',
      });
    } catch (err: any) {
      console.error('[LocalPhotoViewer] Share error:', err);
      Alert.alert('Share Error', err?.message || 'Could not share this photo.');
    } finally {
      setIsSharing(false);
    }
  };

  // Handle safe delete with system confirmation
  const handleDelete = () => {
    if (!currentPhoto) return;

    Alert.alert(
      'Delete from Device',
      'Are you sure you want to delete this photo from your device photo library? This action requires system confirmation and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              if (onDeletePhoto) {
                const success = await onDeletePhoto(currentPhoto.id);
                if (success) {
                  if (photos.length <= 1) {
                    onClose();
                  } else if (currentIndex >= photos.length - 1) {
                    setCurrentIndex(Math.max(0, currentIndex - 1));
                  }
                }
              }
            } catch (err: any) {
              Alert.alert('Delete Error', err?.message || 'Could not delete photo.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isVideo = currentPhoto.mediaType === 'video';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent />

        {/* Top Controls Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 36) }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.circleButton}
            activeOpacity={0.7}
            accessibilityLabel="Close photo viewer"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {currentIndex + 1} of {photos.length}
            </Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.circleButton}
              activeOpacity={0.7}
              disabled={isSharing}
              accessibilityLabel="Share photo"
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFB900" />
              ) : (
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.circleButton, styles.deleteCircleButton]}
              activeOpacity={0.7}
              disabled={isDeleting}
              accessibilityLabel="Delete photo"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF453A" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#FF453A" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Image with Pinch-to-Zoom ScrollView */}
        <View style={styles.imageViewerContainer}>
          <ScrollView
            style={styles.scrollZoom}
            contentContainerStyle={styles.scrollZoomContent}
            maximumZoomScale={Platform.OS === 'web' ? 1 : 3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent
          >
            <Image
              source={{ uri: currentPhoto.uri }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            {isVideo && (
              <View style={styles.videoBadgeOverlay}>
                <Ionicons name="play-circle" size={64} color="rgba(255, 255, 255, 0.9)" />
              </View>
            )}
          </ScrollView>

          {/* Left Arrow Navigation */}
          {hasPrev && (
            <TouchableOpacity
              style={[styles.navArrow, styles.leftNavArrow]}
              onPress={handlePrev}
              activeOpacity={0.7}
              accessibilityLabel="Previous photo"
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Right Arrow Navigation */}
          {hasNext && (
            <TouchableOpacity
              style={[styles.navArrow, styles.rightNavArrow]}
              onPress={handleNext}
              activeOpacity={0.7}
              accessibilityLabel="Next photo"
            >
              <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Floating Metadata Card */}
        <View style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
          <View style={styles.metaHeaderRow}>
            <View style={styles.metaTitleGroup}>
              <Text style={styles.metaDateText}>{formatDate(currentPhoto.creationTime)}</Text>
              <Text style={styles.metaSubText} numberOfLines={1}>
                {currentPhoto.filename || `Photo #${currentPhoto.id.slice(-6)}`}
              </Text>
            </View>

            <View style={styles.privacyPill}>
              <Ionicons name="shield-checkmark" size={13} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.privacyPillText}>Local & Private</Text>
            </View>
          </View>

          {/* Metadata Badges */}
          <View style={styles.metaBadgesRow}>
            {currentPhoto.width > 0 && currentPhoto.height > 0 && (
              <View style={styles.metaBadge}>
                <Ionicons name="crop-outline" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                <Text style={styles.metaBadgeText}>
                  {currentPhoto.width} × {currentPhoto.height}
                </Text>
              </View>
            )}

            <View style={styles.metaBadge}>
              <Ionicons
                name={isVideo ? 'videocam-outline' : 'image-outline'}
                size={12}
                color="#94A3B8"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.metaBadgeText}>
                {isVideo
                  ? `Video${currentPhoto.duration ? ` (${formatDuration(currentPhoto.duration)})` : ''}`
                  : 'Photo'}
              </Text>
            </View>

            <View style={styles.metaBadge}>
              <Ionicons name="hardware-chip-outline" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.metaBadgeText}>On Device</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircleButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  imageViewerContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollZoom: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  scrollZoomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  videoBadgeOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
  },
  navArrow: {
    position: 'absolute',
    top: '45%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  leftNavArrow: {
    left: 12,
  },
  rightNavArrow: {
    right: 12,
  },
  bottomCard: {
    backgroundColor: 'rgba(11, 28, 42, 0.94)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 20,
  },
  metaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaTitleGroup: {
    flex: 1,
    marginRight: 12,
  },
  metaDateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaSubText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  privacyPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  metaBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
