import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface TextInputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: React.ReactNode;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  error,
  isPassword = false,
  required = false,
  containerStyle,
  leftIcon,
  rightAction,
  secureTextEntry,
  ...restProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecured = isPassword && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Field Label */}
      <View style={styles.labelRow}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
        {required && <Text style={[styles.required, { color: theme.colors.error }]}> *</Text>}
      </View>

      {/* Input Box */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error
              ? theme.colors.error
              : isFocused
              ? theme.colors.inputBorderFocused
              : theme.colors.inputBorder,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={
              error
                ? theme.colors.error
                : isFocused
                ? theme.colors.primary
                : theme.colors.textMuted
            }
            style={styles.leftIcon}
          />
        )}

        <TextInput
          placeholderTextColor={theme.colors.placeholderText}
          secureTextEntry={isSecured}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            { color: theme.colors.textPrimary },
          ]}
          {...restProps}
        />

        {/* Show/Hide Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightAction && !isPassword && (
          <View style={styles.rightAction}>{rightAction}</View>
        )}
      </View>

      {/* Validation Error Message */}
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={theme.colors.error}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  required: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    height: '100%',
  },
  passwordToggle: {
    padding: 6,
    marginLeft: 4,
  },
  rightAction: {
    marginLeft: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
