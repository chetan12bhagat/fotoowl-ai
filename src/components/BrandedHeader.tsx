import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { BrandLogo } from './BrandLogo';

export interface BrandedHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showLogo?: boolean;
  rightComponent?: React.ReactNode;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  showLogo = true,
  rightComponent,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 8),
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {/* Left Action / Back Button or Logo */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={onBackPress}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          ) : showLogo ? (
            <BrandLogo size="small" horizontal />
          ) : null}

          {title && (
            <View style={styles.titleWrapper}>
              <Text
                style={[
                  styles.titleText,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={[
                    styles.subtitleText,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Right Section / Controls */}
        <View style={styles.rightSection}>
          {rightComponent ? (
            rightComponent
          ) : (
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={isDark ? '#F59E0B' : theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  titleWrapper: {
    justifyContent: 'center',
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
