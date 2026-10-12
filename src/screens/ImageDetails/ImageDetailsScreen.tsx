import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { BrandedHeader } from '../../components/BrandedHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme } from '../../hooks/useTheme';
import { downloadPhotoToGallery, sharePhoto } from '../../services/media';
import { formatDimensions } from '../../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'ImageDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ImageDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { photo } = route.params;
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [imageLoading, setImageLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [fullViewerVisible, setFullViewerVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(
    null
  );

  const favorited = isFavorite(photo.id);

  // Full-size resolution URL
  const highResUrl =
    photo.download_url || `https://picsum.photos/id/${photo.id}/${photo.width}/${photo.height}`;

  const handleDownload = async () => {
    setStatusMessage(null);
    setDownloading(true);

    try {
      const result = await downloadPhotoToGallery(highResUrl, photo.id);
      setDownloading(false);

      if (result.success) {
        setStatusMessage({ text: result.message, isError: false });
        Alert.alert('Download Complete', result.message, [{ text: 'OK' }]);
      } else {
        setStatusMessage({ text: result.message, isError: true });
        Alert.alert('Download Notice', result.message, [{ text: 'OK' }]);
      }
    } catch (err: any) {
      setDownloading(false);
      const msg = err?.message || 'Failed to download photo.';
      setStatusMessage({ text: msg, isError: true });
      Alert.alert('Error', msg);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    const result = await sharePhoto(highResUrl, photo.author);
    setSharing(false);

    if (result.message) {
      Alert.alert('Share', result.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Branded Header with Back Navigation */}
      <BrandedHeader
        title={`Photo #${photo.id}`}
        subtitle={`By ${photo.author}`}
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            onPress={() => toggleFavorite(photo)}
            style={[
              styles.headerFavoriteBtn,
              {
                backgroundColor: favorited
                  ? 'rgba(239, 68, 68, 0.15)'
                  : theme.colors.surfaceElevated,
                borderColor: favorited ? theme.colors.error : theme.colors.border,
              },
            ]}
            accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={20}
              color={favorited ? theme.colors.error : theme.colors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Message Notification Banner */}
        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: statusMessage.isError
                  ? 'rgba(244, 63, 94, 0.12)'
                  : 'rgba(16, 185, 129, 0.12)',
                borderColor: statusMessage.isError
                  ? theme.colors.error
                  : theme.colors.success,
              },
            ]}
          >
            <Ionicons
              name={statusMessage.isError ? 'alert-circle' : 'checkmark-circle'}
              size={18}
              color={statusMessage.isError ? theme.colors.error : theme.colors.success}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: statusMessage.isError
                    ? theme.colors.error
                    : theme.colors.success,
                },
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* Hero Photo Container (Tap to open full-screen viewer) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setFullViewerVisible(true)}
          style={[
            styles.imageWrapper,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {imageLoading && (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Rendering high-res media...
              </Text>
            </View>
          )}

          <Image
            source={{ uri: highResUrl }}
            style={styles.heroImage}
            resizeMode="cover"
            onLoadEnd={() => setImageLoading(false)}
          />

          <View style={styles.expandHint}>
            <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
            <Text style={styles.expandHintText}>Tap for Full Screen</Text>
          </View>
        </TouchableOpacity>

        {/* Details Card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.authorSection}>
            <View style={styles.authorBadge}>
              <Ionicons name="person" size={14} color={theme.colors.primary} />
              <Text style={[styles.authorLabel, { color: theme.colors.primary }]}>
                CREATOR
              </Text>
            </View>
            <Text
              style={[styles.authorName, { color: theme.colors.textPrimary }]}
            >
              {photo.author}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

          {/* Technical Metadata Grid */}
          <View style={styles.metadataGrid}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                Asset ID
              </Text>
              <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
                #{photo.id}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                Resolution
              </Text>
              <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
                {formatDimensions(photo.width, photo.height)}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                Platform
              </Text>
              <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
                Picsum / FotoOwl.AI
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>
                Format
              </Text>
              <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
                JPEG Full Color
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons: Download & Share */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Download to Gallery"
            onPress={handleDownload}
            loading={downloading}
            icon="download-outline"
            style={styles.actionBtn}
          />

          <View style={styles.secondaryActions}>
            <PrimaryButton
              title="Share Photo"
              onPress={handleShare}
              loading={sharing}
              icon="share-social-outline"
              variant="secondary"
              style={[styles.actionBtn, { flex: 1 }]}
            />

            <PrimaryButton
              title={favorited ? 'Favorited' : 'Favorite'}
              onPress={() => toggleFavorite(photo)}
              icon={favorited ? 'heart' : 'heart-outline'}
              variant={favorited ? 'outline' : 'secondary'}
              style={[styles.actionBtn, { flex: 1 }]}
            />
          </View>
        </View>
      </ScrollView>

      {/* Full-Screen Image Modal Viewer */}
      <Modal
        visible={fullViewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullViewerVisible(false)}
      >
        <View style={styles.fullViewerContainer}>
          {/* Top Floating Close Bar */}
          <View style={styles.fullViewerHeader}>
            <TouchableOpacity
              onPress={() => setFullViewerVisible(false)}
              style={styles.closeFullViewerBtn}
              accessibilityLabel="Close full screen view"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.fullViewerTitle}>
              {photo.author} • #{photo.id}
            </Text>

            <TouchableOpacity
              onPress={handleDownload}
              style={styles.closeFullViewerBtn}
              accessibilityLabel="Download image"
            >
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Full-Screen Centered Image */}
          <View style={styles.fullImageContainer}>
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
  },
  headerFavoriteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  imageLoader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  expandHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 17, 30, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  expandHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
  },
  authorSection: {
    marginBottom: 12,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  authorLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  authorName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  metaItem: {
    width: '50%',
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSection: {
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
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
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeFullViewerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullViewerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  fullImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
