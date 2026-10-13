import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface AddMemoryTileProps {
  onPress: () => void;
  compact?: boolean;
}

export const AddMemoryTile: React.FC<AddMemoryTileProps> = ({ onPress, compact = false }) => {
  const { isDark } = useTheme();

  if (compact) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.compactContainer,
          {
            backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
            borderColor: isDark ? '#1C2F45' : '#E4E7EC',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add New Memory"
      >
        <View style={styles.plusCircleMini}>
          <Ionicons name="add" size={18} color="#071421" />
        </View>
        <Text style={[styles.compactTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Add Memory
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
          borderColor: isDark ? '#FFB900' : '#FFB900',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Create New Memory"
    >
      <View style={styles.contentRow}>
        <View style={styles.plusCircleLarge}>
          <Ionicons name="add" size={26} color="#071421" />
        </View>

        <View style={styles.textColumn}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Create New Memory
            </Text>
            <View style={styles.newBadge}>
              <Ionicons name="sparkles" size={10} color="#FFB900" style={{ marginRight: 3 }} />
              <Text style={styles.newBadgeText}>MOMENTS</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#667085' }]}>
            Capture your celebration, trip, or event with device or FotoOwl photos
          </Text>
        </View>

        <View style={[styles.arrowCircle, { backgroundColor: isDark ? '#1C2F45' : '#FFF9E6' }]}>
          <Ionicons name="chevron-forward" size={18} color="#FFB900" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  plusCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  textColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFB900',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  plusCircleMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
});
