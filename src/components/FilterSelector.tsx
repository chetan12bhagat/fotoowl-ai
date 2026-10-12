import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PhotoFilter } from '../types/photo';
import { useTheme } from '../hooks/useTheme';

export interface FilterSelectorProps {
  activeFilter: PhotoFilter;
  onSelectFilter: (filter: PhotoFilter) => void;
  allCount?: number;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  activeFilter,
  onSelectFilter,
  allCount,
}) => {
  const { theme } = useTheme();

  const options: { id: PhotoFilter; label: string }[] = [
    { id: 'all', label: allCount !== undefined ? `All (${allCount})` : 'All Images' },
    { id: 'A-M', label: 'Authors A–M' },
    { id: 'N-Z', label: 'Authors N–Z' },
  ];

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = activeFilter === option.id;

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onSelectFilter(option.id)}
            activeOpacity={0.75}
            style={[
              styles.pill,
              {
                backgroundColor: isActive
                  ? theme.colors.primary
                  : theme.colors.surfaceElevated,
                borderColor: isActive
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter photos: ${option.label}`}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
