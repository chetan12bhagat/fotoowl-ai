import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { PrimaryButton } from './PrimaryButton';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Log Out',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  icon = null,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialog,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {icon && (
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        confirmVariant === 'danger'
                          ? 'rgba(244, 63, 94, 0.15)'
                          : 'rgba(6, 182, 212, 0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={
                      confirmVariant === 'danger'
                        ? theme.colors.error
                        : theme.colors.primary
                    }
                  />
                </View>
              )}

              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {title}
              </Text>

              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {message}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={onCancel}
                  disabled={loading}
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cancelText, { color: theme.colors.textPrimary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <View style={styles.confirmButtonWrapper}>
                  <PrimaryButton
                    title={confirmText}
                    onPress={onConfirm}
                    variant={confirmVariant}
                    loading={loading}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonWrapper: {
    flex: 1,
  },
});
