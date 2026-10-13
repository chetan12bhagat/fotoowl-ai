import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Memory } from '../types/memory';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MemoryCardProps {
  memory: Memory;
  onPress: (memory: Memory) => void;
  onToggleFavorite?: (memoryId: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onPress,
  onToggleFavorite,
}) => {
  const { isDark } = useTheme();

  // Extract up to 3 thumbnails for the overlapping visual
  const thumbnails = React.useMemo(() => {
    if (memory.coverThumbnails && memory.coverThumbnails.length > 0) {
      return memory.coverThumbnails.slice(0, 3);
    }
    if (memory.photos && memory.photos.length > 0) {
      return memory.photos.slice(0, 3).map((p) => p.uri);
    }
    return [
      'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=400&auto=format&fit=crop',
    ];
  }, [memory]);

  const photoCount = memory.photos ? memory.photos.length : thumbnails.length;
  const people = memory.people || [];

  // Theme styling
  const cardBg = isDark
    ? '#0D1F31'
    : memory.themeColor?.background || '#FFFBEB';
  const cardBorder = isDark
    ? '#1C2F45'
    : memory.themeColor?.border || '#FDE68A';
  const badgeBg = isDark
    ? 'rgba(255, 185, 0, 0.15)'
    : memory.themeColor?.badgeBg || '#FEF3C7';
  const badgeText = isDark
    ? '#FFB900'
    : memory.themeColor?.badgeText || '#B45309';
  const accentColor = isDark
    ? '#FFB900'
    : memory.themeColor?.accent || '#FFB900';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(memory)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${memory.title}, ${photoCount} photos, ${memory.dateRange}`}
    >
      {/* Top Header Row: Category Badge, Date, and Favorite Heart */}
      <View style={styles.topRow}>
        <View style={styles.tagGroup}>
          {memory.category && (
            <View style={[styles.categoryBadge, { backgroundColor: badgeBg }]}>
              <Ionicons name="sparkles" size={11} color={badgeText} style={{ marginRight: 4 }} />
              <Text style={[styles.categoryBadgeText, { color: badgeText }]}>
                {memory.category.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={isDark ? '#94A3B8' : '#667085'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.dateText, { color: isDark ? '#94A3B8' : '#667085' }]}>
              {memory.dateRange}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onToggleFavorite && onToggleFavorite(memory.id)}
          style={[
            styles.heartBtn,
            {
              backgroundColor: isDark ? 'rgba(7, 20, 33, 0.6)' : 'rgba(255, 255, 255, 0.85)',
            },
          ]}
          activeOpacity={0.7}
          accessibilityLabel={memory.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={memory.isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={memory.isFavorite ? '#E11D48' : isDark ? '#94A3B8' : '#667085'}
          />
        </TouchableOpacity>
      </View>

      {/* Middle Section: Three Overlapping Photo Thumbnails */}
      <View style={styles.thumbnailsSection}>
        <View style={styles.overlappingStackContainer}>
          {/* Thumbnail 1 (Left, tilted slightly left) */}
          {thumbnails[0] && (
            <View style={[styles.thumbWrapper, styles.thumbLeft]}>
              <Image source={{ uri: thumbnails[0] }} style={styles.thumbnailImage} />
            </View>
          )}

          {/* Thumbnail 2 (Center, forward and centered) */}
          {thumbnails[1] ? (
            <View style={[styles.thumbWrapper, styles.thumbCenter]}>
              <Image source={{ uri: thumbnails[1] }} style={styles.thumbnailImage} />
            </View>
          ) : (
            <View style={[styles.thumbWrapper, styles.thumbCenter, styles.thumbPlaceholder]}>
              <Ionicons name="images" size={24} color="#94A3B8" />
            </View>
          )}

          {/* Thumbnail 3 (Right, tilted slightly right) */}
          {thumbnails[2] ? (
            <View style={[styles.thumbWrapper, styles.thumbRight]}>
              <Image source={{ uri: thumbnails[2] }} style={styles.thumbnailImage} />
            </View>
          ) : (
            <View style={[styles.thumbWrapper, styles.thumbRight, styles.thumbPlaceholder]}>
              <Ionicons name="camera-outline" size={24} color="#94A3B8" />
            </View>
          )}

          {/* Overflow count badge if there are more than 3 photos */}
          {photoCount > 3 && (
            <View style={[styles.photoCountPill, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
              <Ionicons name="images" size={12} color={accentColor} style={{ marginRight: 4 }} />
              <Text style={[styles.photoCountPillText, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                +{photoCount - 3} more
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Section: Title, Photos Count, and Tagged People Avatars */}
      <View style={styles.bottomSection}>
        <View style={styles.titleCol}>
          <Text
            style={[styles.memoryTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}
            numberOfLines={1}
          >
            {memory.title}
          </Text>

          {memory.description ? (
            <Text
              style={[styles.memoryDesc, { color: isDark ? '#94A3B8' : '#667085' }]}
              numberOfLines={1}
            >
              {memory.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          {/* Actual number of photos */}
          <View style={styles.countBadge}>
            <Ionicons name="image-outline" size={14} color={accentColor} style={{ marginRight: 4 }} />
            <Text style={[styles.countBadgeText, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
            </Text>
          </View>

          {/* People Avatars */}
          {people.length > 0 && (
            <View style={styles.peopleAvatarsGroup}>
              {people.slice(0, 3).map((person, idx) => (
                <View
                  key={person.id || idx}
                  style={[
                    styles.avatarWrapper,
                    {
                      marginLeft: idx > 0 ? -10 : 0,
                      zIndex: 10 - idx,
                      borderColor: cardBg,
                    },
                  ]}
                >
                  {person.avatarUrl ? (
                    <Image source={{ uri: person.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {person.initials || person.name.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {people.length > 3 && (
                <View
                  style={[
                    styles.avatarWrapper,
                    styles.avatarMore,
                    { marginLeft: -10, zIndex: 5, borderColor: cardBg },
                  ]}
                >
                  <Text style={styles.avatarMoreText}>+{people.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          <View style={[styles.chevronBtn, { backgroundColor: isDark ? '#1C2F45' : '#FFFFFF' }]}>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#FFFFFF' : '#101828'} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnailsSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  overlappingStackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
    position: 'relative',
  },
  thumbWrapper: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbLeft: {
    transform: [{ translateX: -60 }, { rotate: '-8deg' }],
    zIndex: 1,
  },
  thumbCenter: {
    transform: [{ translateX: 0 }, { scale: 1.06 }],
    zIndex: 3,
  },
  thumbRight: {
    transform: [{ translateX: 60 }, { rotate: '8deg' }],
    zIndex: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountPill: {
    position: 'absolute',
    bottom: -6,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  photoCountPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  titleCol: {
    marginBottom: 10,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  memoryDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  peopleAvatarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#071421',
  },
  avatarMore: {
    backgroundColor: '#344054',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
});
