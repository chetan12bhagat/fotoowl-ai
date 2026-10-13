import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DownloadProgressModal } from '../../components/DownloadProgressModal';
import { ImageShareSheetModal } from '../../components/ImageShareSheetModal';
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme } from '../../hooks/useTheme';
import { downloadPhotoToGallery, sharePhoto } from '../../services/media';

type Props = NativeStackScreenProps<RootStackParamList, 'ImageDetails'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { photo } = route.params;
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [imageLoading, setImageLoading] = useState(true);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [fullViewerVisible, setFullViewerVisible] = useState(false);

  const downloadIntervalRef = useRef<any>(null);

  const favorited = isFavorite(photo.id);

  // Full-size resolution URL
  const highResUrl =
    photo.download_url ||
    `https://picsum.photos/id/${photo.id}/${photo.width || 1200}/${photo.height || 800}`;

  // Photographer initials for avatar
  const initials = photo.author
    ? photo.author
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FO';

  const handleStartDownload = async () => {
    setDownloadProgress(10);
    setDownloadComplete(false);
    setDownloadModalVisible(true);

    // Smooth realistic progress animation
    let currentProg = 10;
    downloadIntervalRef.current = setInterval(() => {
      currentProg += Math.floor(Math.random() * 15) + 12;
      if (currentProg >= 90) {
        clearInterval(downloadIntervalRef.current);
        setDownloadProgress(92);
      } else {
        setDownloadProgress(currentProg);
      }
    }, 250);

    try {
      const result = await downloadPhotoToGallery(highResUrl, photo.id);
      clearInterval(downloadIntervalRef.current);
      setDownloadProgress(100);
      setDownloadComplete(true);

      setTimeout(() => {
        setDownloadModalVisible(false);
        Alert.alert(
          result.success ? 'Saved to Gallery' : 'Download Notice',
          result.message,
          [{ text: 'OK' }]
        );
      }, 700);
    } catch (err: any) {
      clearInterval(downloadIntervalRef.current);
      setDownloadModalVisible(false);
      Alert.alert('Download Error', err?.message || 'Could not download photo.');
    }
  };

  const handleCancelDownload = () => {
    if (downloadIntervalRef.current) {
      clearInterval(downloadIntervalRef.current);
    }
    setDownloadModalVisible(false);
    setDownloadProgress(0);
  };

  const handleOpenShareSheet = () => {
    setShareModalVisible(true);
  };

  const handleNativeShare = async () => {
    setShareModalVisible(false);
    await sharePhoto(highResUrl, photo.author);
  };

  const handleSaveFromShareSheet = async () => {
    setShareModalVisible(false);
    handleStartDownload();
  };

  const handleAddToSharedAlbum = () => {
    setShareModalVisible(false);
    Alert.alert(
      'Shared Album',
      `"Photo ID: ${photo.id}" added to your FotoOwl.AI Event Album.`,
      [{ text: 'Done' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* Edge-to-edge photo display matching Reference Image 1 */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => setFullViewerVisible(true)}
        style={styles.heroImageContainer}
      >
        {imageLoading && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="large" color="#FFB900" />
          </View>
        )}
        <Image
          source={{ uri: highResUrl }}
          style={styles.heroImage}
          resizeMode="cover"
          onLoadEnd={() => setImageLoading(false)}
        />
      </TouchableOpacity>

      {/* Floating Top Header Navigation Bar matching Reference Image 1 */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 10, 36),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circleActionBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            onPress={handleOpenShareSheet}
            style={styles.circleActionBtn}
            activeOpacity={0.7}
            accessibilityLabel="Share photo"
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(photo)}
            style={[
              styles.circleActionBtn,
              favorited && styles.circleActionBtnActive,
            ]}
            activeOpacity={0.7}
            accessibilityLabel={favorited ? 'Remove favorite' : 'Add favorite'}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={20}
              color={favorited ? '#FFB900' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Floating Metadata Card matching Reference Image 1 */}
      <View
        style={[
          styles.bottomCard,
          {
            paddingBottom: Math.max(insets.bottom + 16, 28),
          },
        ]}
      >
        {/* Photographer Info Row */}
        <View style={styles.authorRow}>
          <View style={styles.authorAvatarCircle}>
            <Text style={styles.authorAvatarText}>{initials}</Text>
          </View>

          <View style={styles.authorTextCol}>
            <Text style={styles.authorIdText}>ID: {photo.id}</Text>
            <Text style={styles.authorNameText} numberOfLines={1}>
              {photo.author}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => toggleFavorite(photo)}
            style={styles.heartMiniBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={22}
              color={favorited ? '#FFB900' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Buttons Row: Download & Share */}
        <View style={styles.buttonsContainer}>
          {/* Prominent Gold Download Button matching Reference Image 1 */}
          <PrimaryButton
            title="Download"
            onPress={handleStartDownload}
            icon="download-outline"
            style={styles.downloadButton}
            textStyle={styles.downloadButtonText}
          />

          {/* Secondary Share Button matching Reference Image 1 */}
          <TouchableOpacity
            onPress={handleOpenShareSheet}
            activeOpacity={0.8}
            style={styles.secondaryShareBtn}
          >
            <Ionicons
              name="share-outline"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.secondaryShareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Download Progress Modal matching Reference Image 1 */}
      <DownloadProgressModal
        visible={downloadModalVisible}
        progress={downloadProgress}
        isComplete={downloadComplete}
        onCancel={handleCancelDownload}
      />

      {/* Image Share Sheet Modal matching Reference Image 1 */}
      <ImageShareSheetModal
        visible={shareModalVisible}
        photo={photo}
        onClose={() => setShareModalVisible(false)}
        onNativeShare={handleNativeShare}
        onSaveToPhotos={handleSaveFromShareSheet}
        onAddToSharedAlbum={handleAddToSharedAlbum}
      />

      {/* Full Screen Image Pinch/Zoom Viewer Modal */}
      <Modal
        visible={fullViewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullViewerVisible(false)}
      >
        <View style={styles.fullViewerContainer}>
          <View style={[styles.fullViewerHeader, { paddingTop: Math.max(insets.top + 8, 24) }]}>
            <TouchableOpacity
              onPress={() => setFullViewerVisible(false)}
              style={styles.circleActionBtn}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.fullViewerTitle}>
              {photo.author} • #{photo.id}
            </Text>
            <TouchableOpacity
              onPress={handleStartDownload}
              style={styles.circleActionBtn}
            >
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.fullImageWrapper}>
            <Image
              source={{ uri: highResUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071421',
  },
  heroImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071421',
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  circleActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(7, 20, 33, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  circleActionBtnActive: {
    borderColor: '#FFB900',
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 20, 33, 0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#1C2F45',
    paddingHorizontal: 20,
    paddingTop: 18,
    zIndex: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#112538',
    borderWidth: 1.5,
    borderColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    color: '#FFB900',
    fontSize: 14,
    fontWeight: '800',
  },
  authorTextCol: {
    flex: 1,
  },
  authorIdText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  authorNameText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heartMiniBtn: {
    padding: 6,
  },
  buttonsContainer: {
    gap: 12,
  },
  downloadButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFB900',
  },
  downloadButtonText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryShareBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1C2F45',
    backgroundColor: 'rgba(11, 28, 42, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryShareBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fullViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  fullViewerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  fullImageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
