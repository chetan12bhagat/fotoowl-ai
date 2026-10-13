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
    { id: 'all', label: 'All' },
    { id: 'A-M', label: 'A - M' },
    { id: 'N-Z', label: 'N - Z' },
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
                  ? '#FFB900'
                  : theme.colors.surface,
                borderColor: isActive
                  ? '#FFB900'
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
                  color: isActive ? '#071421' : theme.colors.textSecondary,
                  fontWeight: isActive ? '800' : '600',
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
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
