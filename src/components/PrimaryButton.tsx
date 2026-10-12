import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
        };
      case 'primary':
      default:
        return {
          backgroundColor: theme.colors.primary,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'secondary':
        return theme.colors.textPrimary;
      case 'outline':
        return theme.colors.primary;
      case 'danger':
        return '#FFFFFF';
      case 'primary':
      default:
        return '#FFFFFF';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.button,
        getContainerStyle(),
        isDisabled && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
