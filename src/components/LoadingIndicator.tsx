import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading photos...',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {!!message && (
        <Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
