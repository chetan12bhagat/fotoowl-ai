import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface ProfilePhotoPreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onChangePhoto?: () => void;
}

export const ProfilePhotoPreviewModal: React.FC<ProfilePhotoPreviewModalProps> = ({
  visible,
  imageUri,
  loading = false,
  onConfirm,
  onCancel,
  onChangePhoto,
}) => {
  const { theme, isDark } = useTheme();

  if (!visible || !imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
              borderColor: isDark ? '#1C2F45' : '#E4E7EC',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="camera" size={16} color="#071421" />
              </View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? '#FFFFFF' : '#101828' },
                ]}
              >
                Preview Profile Photo
              </Text>
            </View>
            {!loading && (
              <TouchableOpacity
                onPress={onCancel}
                style={styles.closeBtn}
                accessibilityLabel="Close photo preview"
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? '#94A3B8' : '#667085'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Subtitle / Description */}
          <Text
            style={[
              styles.subtitleText,
              { color: isDark ? '#94A3B8' : '#667085' },
            ]}
          >
            Review how your profile photo appears in circular avatar format.
          </Text>

          {/* Circular Avatar Preview Container */}
          <View style={styles.previewCenterStage}>
            <View
              style={[
                styles.avatarRing,
                {
                  borderColor: '#FFB900',
                  backgroundColor: isDark ? '#071421' : '#F8FAFC',
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.previewAvatarImg}
                resizeMode="cover"
              />
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={14} color="#071421" />
              </View>
            </View>

            {/* Crop Format Indicator */}
            <View
              style={[
                styles.cropPill,
                {
                  backgroundColor: isDark ? '#1C2F45' : '#F2F4F7',
                },
              ]}
            >
              <Ionicons name="crop" size={12} color="#FFB900" style={{ marginRight: 4 }} />
              <Text
                style={[
                  styles.cropPillText,
                  { color: isDark ? '#E2E8F0' : '#475467' },
                ]}
              >
                Cropped 1:1 Square • Displayed as Circular Avatar
              </Text>
            </View>
          </View>

          {/* Privacy Note */}
          <View
            style={[
              styles.privacyCard,
              {
                backgroundColor: isDark ? 'rgba(255, 185, 0, 0.08)' : '#FFFDF5',
                borderColor: isDark ? 'rgba(255, 185, 0, 0.25)' : '#FEE4A6',
              },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#FFB900" style={{ marginTop: 1 }} />
            <Text
              style={[
                styles.privacyCardText,
                { color: isDark ? '#E2E8F0' : '#475467' },
              ]}
            >
              Only saved when you confirm below. Your picture remains private to your authenticated account.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[
                styles.saveButton,
                loading && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#071421" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#071421" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Save Profile Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryActionsRow}>
              {onChangePhoto && (
                <TouchableOpacity
                  onPress={onChangePhoto}
                  disabled={loading}
                  style={[
                    styles.chooseAnotherBtn,
                    { borderColor: isDark ? '#1C2F45' : '#D0D5DD' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chooseAnotherText,
                      { color: isDark ? '#FFFFFF' : '#344054' },
                    ]}
                  >
                    Choose Another
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                style={[
                  styles.cancelBtn,
                  {
                    borderColor: isDark ? '#1C2F45' : '#D0D5DD',
                    flex: onChangePhoto ? 1 : undefined,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: isDark ? '#94A3B8' : '#667085' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 33, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  previewCenterStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  avatarRing: {
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 3.5,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#FFB900',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  previewAvatarImg: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#E4E7EC',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFB900',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  cropPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 16,
  },
  privacyCardText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#FFB900',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#FFB900',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071421',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chooseAnotherBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseAnotherText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
