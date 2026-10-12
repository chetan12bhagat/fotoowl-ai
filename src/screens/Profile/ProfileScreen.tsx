import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gender, ProfileUpdateData } from '../../types/user';
import { BrandedHeader } from '../../components/BrandedHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextInputField } from '../../components/TextInputField';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POPULAR_CITIES } from '../../constants/cities';
import { validateProfileUpdateForm, FormErrors } from '../../utils/validation';

const AVATAR_OPTIONS = [
  { id: 'owl_avatar_1', icon: 'sparkles', label: 'AI Owl Prime', color: '#06B6D4' },
  { id: 'owl_avatar_2', icon: 'camera', label: 'Photo Pro', color: '#38BDF8' },
  { id: 'owl_avatar_3', icon: 'eye', label: 'Vision Focus', color: '#F59E0B' },
  { id: 'owl_avatar_4', icon: 'planet', label: 'Galaxy Vision', color: '#A855F7' },
];

export const ProfileScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<ProfileUpdateData>({
    fullName: user?.fullName || '',
    mobileNumber: user?.mobileNumber || '',
    gender: user?.gender || 'Male',
    address: user?.address || '',
    city: user?.city || 'Bangalore',
    avatarId: user?.avatarId || 'owl_avatar_1',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const activeAvatar =
    AVATAR_OPTIONS.find((a) => a.id === user?.avatarId) || AVATAR_OPTIONS[0];

  const handleOpenEdit = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        gender: user.gender,
        address: user.address,
        city: user.city,
        avatarId: user.avatarId,
      });
      setErrors({});
      setEditModalVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    const valErrors = validateProfileUpdateForm(editForm);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }

    setSavingProfile(true);
    const result = await updateProfile(editForm);
    setSavingProfile(false);

    if (result.success) {
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile changes have been saved.');
    } else {
      Alert.alert('Update Failed', result.message || 'Unable to save changes.');
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (user) {
      await updateProfile({
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        gender: user.gender,
        address: user.address,
        city: user.city,
        avatarId,
      });
    }
    setAvatarModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Branded Header */}
      <BrandedHeader title="User Profile" subtitle="Account & App Settings" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card & Avatar */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(true)}
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: activeAvatar.color,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeAvatar.icon as any}
                size={34}
                color={activeAvatar.color}
              />
              <View style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
              {user?.fullName || 'FotoOwl Member'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {user?.email}
            </Text>
            <View
              style={[
                styles.membershipPill,
                {
                  backgroundColor: 'rgba(6, 182, 212, 0.12)',
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text style={[styles.membershipText, { color: theme.colors.primary }]}>
                Verified Member • FotoOwl.AI
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Information Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Personal Information
            </Text>
            <TouchableOpacity
              onPress={handleOpenEdit}
              style={[
                styles.editButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                  Email Address
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                  {user?.email || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <Ionicons name="call-outline" size={18} color={theme.colors.textMuted} />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                  Mobile Number
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                  {user?.mobileNumber || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <Ionicons name="male-female-outline" size={18} color={theme.colors.textMuted} />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                  Gender
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                  {user?.gender || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <Ionicons name="location-outline" size={18} color={theme.colors.textMuted} />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                  Address
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                  {user?.address || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <Ionicons name="business-outline" size={18} color={theme.colors.textMuted} />
              </View>
              <View style={styles.infoContentCol}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                  City
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                  {user?.city || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences & Appearance Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Preferences
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.preferenceRow}
            activeOpacity={0.7}
          >
            <View style={styles.preferenceLeft}>
              <Ionicons
                name={isDark ? 'moon-outline' : 'sunny-outline'}
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceTitle, { color: theme.colors.textPrimary }]}>
                  Application Theme
                </Text>
                <Text style={[styles.preferenceSubtitle, { color: theme.colors.textSecondary }]}>
                  Currently using {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.themeToggleBadge,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.themeBadgeText, { color: theme.colors.textPrimary }]}>
                {isDark ? 'Dark' : 'Light'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutWrapper}>
          <PrimaryButton
            title="Log Out of FotoOwl.AI"
            onPress={() => setLogoutDialogVisible(true)}
            variant="danger"
            icon="log-out-outline"
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.editModalContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.editModalHeader}>
              <Text
                style={[
                  styles.editModalTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editModalScroll}
            >
              <TextInputField
                label="Full Name"
                value={editForm.fullName}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, fullName: text }))
                }
                error={errors.fullName}
                required
              />

              <TextInputField
                label="Mobile Number"
                value={editForm.mobileNumber}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setEditForm((prev) => ({ ...prev, mobileNumber: cleaned }));
                }}
                keyboardType="number-pad"
                maxLength={10}
                error={errors.mobileNumber}
                required
              />

              {/* Gender selector */}
              <View style={styles.editGenderWrapper}>
                <Text
                  style={[
                    styles.editGenderLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Gender
                </Text>
                <View style={styles.editGenderRow}>
                  {(['Male', 'Female', 'Other'] as Gender[]).map((g) => {
                    const sel = editForm.gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setEditForm((prev) => ({ ...prev, gender: g }))}
                        style={[
                          styles.editGenderBtn,
                          {
                            backgroundColor: sel
                              ? theme.colors.surfaceElevated
                              : theme.colors.inputBackground,
                            borderColor: sel
                              ? theme.colors.primary
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.editGenderText,
                            {
                              color: sel
                                ? theme.colors.primary
                                : theme.colors.textSecondary,
                              fontWeight: sel ? '700' : '400',
                            },
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TextInputField
                label="Street Address"
                value={editForm.address}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, address: text }))
                }
                error={errors.address}
                required
              />

              <TextInputField
                label="City"
                value={editForm.city}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, city: text }))
                }
                error={errors.city}
                required
              />

              <View style={styles.modalActionsRow}>
                <PrimaryButton
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  loading={savingProfile}
                  icon="checkmark-outline"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Avatar Selection Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.avatarModalContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarModalTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Choose Profile Avatar
            </Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((av) => (
                <TouchableOpacity
                  key={av.id}
                  onPress={() => handleSelectAvatar(av.id)}
                  style={[
                    styles.avatarOption,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: av.color,
                    },
                  ]}
                >
                  <Ionicons name={av.icon as any} size={28} color={av.color} />
                  <Text style={[styles.avatarOptionLabel, { color: theme.colors.textPrimary }]}>
                    {av.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(false)}
              style={styles.cancelAvatarBtn}
            >
              <Text style={{ color: theme.colors.textMuted }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={logoutDialogVisible}
        title="Log Out"
        message="Are you sure you want to log out of your FotoOwl.AI account? Your saved favorites will remain preserved."
        confirmText="Log Out"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="log-out-outline"
        onConfirm={async () => {
          setLogoutDialogVisible(false);
          await logout();
        }}
        onCancel={() => setLogoutDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 4,
  },
  membershipPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
  },
  membershipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoList: {
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconCol: {
    width: 32,
    alignItems: 'center',
  },
  infoContentCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceText: {},
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  preferenceSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  themeToggleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutWrapper: {
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContainer: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  editModalScroll: {
    paddingBottom: 16,
  },
  editGenderWrapper: {
    marginBottom: 16,
  },
  editGenderLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  editGenderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editGenderBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editGenderText: {
    fontSize: 13,
  },
  modalActionsRow: {
    marginTop: 8,
  },
  avatarModalContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  avatarModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  avatarOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  cancelAvatarBtn: {
    marginTop: 16,
    padding: 8,
  },
});
