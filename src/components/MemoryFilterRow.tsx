import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MemoryFilter } from '../types/memory';
import { useTheme } from '../hooks/useTheme';

interface MemoryFilterRowProps {
  activeFilter: MemoryFilter;
  onSelectFilter: (filter: MemoryFilter) => void;
  counts: {
    all: number;
    my: number;
    shared: number;
    favorites: number;
  };
}

export const MemoryFilterRow: React.FC<MemoryFilterRowProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const { isDark } = useTheme();

  const FILTERS: { id: MemoryFilter; label: string; count: number; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'all', label: 'All Memories', count: counts.all, icon: 'grid-outline' },
    { id: 'my', label: 'My Memories', count: counts.my, icon: 'person-outline' },
    { id: 'shared', label: 'Shared Memories', count: counts.shared, icon: 'people-outline' },
    { id: 'favorites', label: 'Favorites', count: counts.favorites, icon: 'heart-outline' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => onSelectFilter(f.id)}
              activeOpacity={0.75}
              style={[
                styles.pill,
                isActive
                  ? [styles.activePill, { backgroundColor: isDark ? '#FFB900' : '#071421' }]
                  : [
                      styles.inactivePill,
                      {
                        backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                        borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                      },
                    ],
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${f.label}, ${f.count} items`}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={
                  isActive
                    ? isDark
                      ? '#071421'
                      : '#FFFFFF'
                    : isDark
                    ? '#94A3B8'
                    : '#667085'
                }
                style={styles.pillIcon}
              />
              <Text
                style={[
                  styles.pillText,
                  isActive
                    ? [styles.activePillText, { color: isDark ? '#071421' : '#FFFFFF' }]
                    : [styles.inactivePillText, { color: isDark ? '#94A3B8' : '#344054' }],
                ]}
              >
                {f.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  isActive
                    ? { backgroundColor: isDark ? 'rgba(7, 20, 33, 0.15)' : 'rgba(255, 255, 255, 0.2)' }
                    : { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isActive
                      ? { color: isDark ? '#071421' : '#FFFFFF' }
                      : { color: isDark ? '#94A3B8' : '#667085' },
                  ]}
                >
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  activePill: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inactivePill: {},
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  activePillText: {
    fontWeight: '700',
  },
  inactivePillText: {},
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
