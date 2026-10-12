import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'images-outline',
  title,
  description,
  actionTitle,
  onAction,
  actionIcon,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={theme.colors.primary} />
      </View>

      <Text
        style={[
          styles.title,
          { color: theme.colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: theme.colors.textSecondary },
        ]}
      >
        {description}
      </Text>

      {actionTitle && onAction && (
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            title={actionTitle}
            onPress={onAction}
            icon={actionIcon}
            variant="outline"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginVertical: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  buttonWrapper: {
    minWidth: 160,
  },
});
