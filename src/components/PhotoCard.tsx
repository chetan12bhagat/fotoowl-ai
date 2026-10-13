import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '../types/photo';
import { useTheme } from '../hooks/useTheme';
import { useFavorites } from '../hooks/useFavorites';

export interface PhotoCardProps {
  photo: Photo;
  onPress: (photo: Photo) => void;
  width?: number;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onPress, width }) => {
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const favorited = isFavorite(photo.id);

  // Compute optimized thumbnail URL for performance, with fallback to download_url
  // Picsum URL format: https://picsum.photos/id/{id}/{width}/{height}
  const thumbnailUrl = photo.download_url
    ? `https://picsum.photos/id/${photo.id}/500/350`
    : `https://picsum.photos/id/${photo.id}/500/350`;

  const handleFavoritePress = () => {
    toggleFavorite(photo);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(photo)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          width: width ? width : '100%',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Photo by ${photo.author}, ID ${photo.id}`}
    >
      {/* Image Preview Container */}
      <View style={[styles.imageContainer, { backgroundColor: theme.colors.surfaceElevated }]}>
        {imageLoading && !imageError && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}

        {imageError ? (
          <View style={styles.errorPlaceholder}>
            <Ionicons name="image-outline" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.errorPlaceholderText, { color: theme.colors.textMuted }]}>
              Preview unavailable
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        )}

        {/* Floating Favorite Button */}
        <TouchableOpacity
          onPress={handleFavoritePress}
          activeOpacity={0.7}
          style={[
            styles.favoriteButton,
            {
              backgroundColor: favorited ? '#FFB900' : 'rgba(7, 20, 33, 0.65)',
            },
          ]}
          accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={16}
            color={favorited ? '#071421' : '#FFFFFF'}
          />
        </TouchableOpacity>

        {/* Gradient Scrim on Image */}
        <View style={styles.imageOverlayGradient} />

        {/* Overlay Metadata on Image matching Reference Image 1 */}
        <View style={styles.metaOverlay}>
          <Text style={styles.photoIdText}>ID: {photo.id}</Text>
          <Text style={styles.authorOverlayText} numberOfLines={1}>
            {photo.author}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorPlaceholderText: {
    fontSize: 11,
    marginTop: 6,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  imageOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: 'rgba(7, 20, 33, 0.78)',
  },
  metaOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 8,
    zIndex: 5,
  },
  photoIdText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  authorOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
