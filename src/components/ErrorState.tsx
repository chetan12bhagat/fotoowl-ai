import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { PrimaryButton } from './PrimaryButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not fetch the photo gallery. Please check your internet connection.',
  onRetry,
  retryText = 'Try Again',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            borderColor: theme.colors.error,
          },
        ]}
      >
        <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.error} />
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
          styles.message,
          { color: theme.colors.textSecondary },
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            title={retryText}
            onPress={onRetry}
            icon="reload"
            variant="primary"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 200,
  },
});
