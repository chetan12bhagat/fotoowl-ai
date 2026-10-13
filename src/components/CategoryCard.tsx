import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryInfo, PhotoCategory } from '../types/photo';

export interface CategoryCardProps {
  category: CategoryInfo;
  isSelected: boolean;
  onPress: (id: PhotoCategory) => void;
  width?: number | string;
  height?: number | string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onPress,
  width,
  height,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(category.id)}
      style={[
        styles.cardContainer,
        width !== undefined ? { width } : undefined,
        height !== undefined ? { height } : undefined,
        {
          borderColor: isSelected ? '#FFB900' : 'rgba(255, 255, 255, 0.12)',
          borderWidth: isSelected ? 2.5 : 1,
        },
        isSelected && styles.cardSelected,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${category.title} photos. ${category.subtitle}`}
      accessibilityState={{ selected: isSelected }}
    >
      {/* Background Photography with 4:3 aspect ratio */}
      <Image
        source={{ uri: category.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => setHasError(true)}
      />

      {/* Loading Skeleton */}
      {!imageLoaded && !hasError && (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="small" color="#FFB900" />
        </View>
      )}

      {/* Error Fallback */}
      {hasError && (
        <View style={styles.imageError}>
          <Ionicons name="image-outline" size={24} color="#64748B" />
        </View>
      )}

      {/* Subtle Dark Vignette Scrim */}
      <View style={styles.vignetteOverlay} />

      {/* Active Selection Badge */}
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark" size={13} color="#071421" />
        </View>
      )}

      {/* Dark Translucent Category Title Banner at bottom */}
      <View style={styles.titleBanner}>
        <Text style={styles.titleText} numberOfLines={1}>
          {category.title}
        </Text>
        {category.countLabel && (
          <Text style={styles.countText} numberOfLines={1}>
            {category.countLabel}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16, // Consistent 14-18px corner radius
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#071421',
    width: '100%',
    aspectRatio: 4 / 3, // Consistent 4:3 aspect ratio
    // Web smooth transition and hover
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.25s ease, border-color 0.2s ease, box-shadow 0.25s ease',
      } as any,
    }),
  },
  cardSelected: {
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0B1C2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageError: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0B1C2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 20, 33, 0.25)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFB900',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 5,
  },
  titleBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 20, 33, 0.86)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  countText: {
    color: '#FFB900', // Gold for moment count
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
