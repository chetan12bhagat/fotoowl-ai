import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
  Image,
  FlatList,
  Linking,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../../types/navigation';
import { Gender, ProfileUpdateData } from '../../types/user';
import { BrandLogo } from '../../components/BrandLogo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextInputField } from '../../components/TextInputField';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { ProfilePhotoPreviewModal } from '../../components/ProfilePhotoPreviewModal';
import {
  pickProfilePhotoFromGallery,
  takeProfilePhotoWithCamera,
  uploadProfilePhotoToServer,
} from '../../services/profilePhotoService';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useFavorites } from '../../hooks/useFavorites';
import { POPULAR_CITIES } from '../../constants/cities';
import { validateProfileUpdateForm, FormErrors } from '../../utils/validation';
import {
  getSavedNotificationsEnabled,
  saveNotificationsEnabled,
  getSavedLanguage,
  saveLanguage,
} from '../../storage/asyncStorage';

type TabNavProp = BottomTabNavigationProp<MainTabParamList>;

const LANGUAGES = [
  { id: 'en', label: 'English (US)' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'hi', label: 'हिन्दी' },
];

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TabNavProp>();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { user, logout, updateProfile, updateAvatar, deleteAccount } = useAuth();
  const { favoritesCount } = useFavorites();

  // Navigation / View states: 'settings' is the primary modern settings dashboard
  const [currentView, setCurrentView] = useState<'settings' | 'edit'>('settings');

  // Dialog & Modal visibility states
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [deleteAccountDialogVisible, setDeleteAccountDialogVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [accountDetailsModalVisible, setAccountDetailsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Profile Picture management states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedUri, setLastUploadedUri] = useState<string | null>(null);
  const [uploadSuccessBadge, setUploadSuccessBadge] = useState(false);
  const [removePhotoDialogVisible, setRemovePhotoDialogVisible] = useState(false);
  const [photoOptionsModalVisible, setPhotoOptionsModalVisible] = useState(false);
  const [stagedAvatarUri, setStagedAvatarUri] = useState<string | null | undefined>(user?.avatarUri);

  // Smooth subtle transition animation for avatar image updates
  const avatarFadeAnim = useRef(new Animated.Value(1)).current;

  // Trigger smooth transition whenever avatar URI changes
  useEffect(() => {
    avatarFadeAnim.setValue(0.4);
    Animated.timing(avatarFadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [user?.avatarUri, stagedAvatarUri]);

  // Preference states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<ProfileUpdateData>({
    fullName: user?.fullName || 'John Doe',
    mobileNumber: user?.mobileNumber || '+91 98765 43210',
    gender: user?.gender || 'Male',
    address: user?.address || '123 Main Street, Pune',
    city: user?.city || 'Pune',
    avatarUri: user?.avatarUri,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load preferences from storage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const notifs = await getSavedNotificationsEnabled();
        setNotificationsEnabled(notifs);
        const lang = await getSavedLanguage();
        setSelectedLanguage(lang);
      } catch (err) {
        console.warn('Failed to load preferences:', err);
      }
    };
    loadPreferences();
  }, []);

  // Update editForm when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || 'John Doe',
        mobileNumber: user.mobileNumber || '+91 98765 43210',
        gender: user.gender || 'Male',
        address: user.address || '123 Main Street, Pune',
        city: user.city || 'Pune',
        avatarUri: user.avatarUri,
      });
      setStagedAvatarUri(user.avatarUri);
    }
  }, [user]);

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val);
    await saveNotificationsEnabled(val);
  };

  const handleSelectLanguage = async (langLabel: string) => {
    setSelectedLanguage(langLabel);
    setLanguageModalVisible(false);
    await saveLanguage(langLabel);
  };

  const handleOpenEdit = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName || 'John Doe',
        mobileNumber: user.mobileNumber || '+91 98765 43210',
        gender: user.gender || 'Male',
        address: user.address || '123 Main Street, Pune',
        city: user.city || 'Pune',
        avatarUri: user.avatarUri,
      });
      setStagedAvatarUri(user.avatarUri);
    }
    setErrors({});
    setCurrentView('edit');
  };

  const handleSaveProfile = async () => {
    const valErrors = validateProfileUpdateForm(editForm);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }

    setSavingProfile(true);
    const payload: ProfileUpdateData = {
      ...editForm,
      avatarUri: stagedAvatarUri !== undefined ? (stagedAvatarUri || null) : user?.avatarUri,
    };
    const result = await updateProfile(payload);
    setSavingProfile(false);

    if (result.success) {
      setCurrentView('settings');
      Alert.alert('Profile Saved', 'Your profile updates have been successfully applied.');
    } else {
      Alert.alert('Update Notice', result.message || 'Unable to save profile changes.');
    }
  };

  // Profile Photo Pick from Gallery — Direct instant launch without blocking
  const handlePickFromGallery = async () => {
    setPhotoOptionsModalVisible(false);
    const result = await pickProfilePhotoFromGallery();
    if (result.canceled) {
      if (result.errorMessage) {
        Alert.alert('Photo Selection Notice', result.errorMessage);
      }
      return;
    }
    if (result.uri) {
      setPreviewImageUri(result.uri);
      setPreviewModalVisible(true);
    }
  };

  // Profile Photo Take with Camera — Instant launch
  const handleTakeWithCamera = async () => {
    setPhotoOptionsModalVisible(false);
    const result = await takeProfilePhotoWithCamera();
    if (result.canceled) {
      if (result.errorMessage) {
        Alert.alert('Camera Notice', result.errorMessage);
      }
      return;
    }
    if (result.uri) {
      setPreviewImageUri(result.uri);
      setPreviewModalVisible(true);
    }
  };

  // Confirm photo in preview modal — Instant optimistic update + background upload
  const handleConfirmPreviewPhoto = async () => {
    if (!previewImageUri) return;
    const selectedUri = previewImageUri;

    // 1. Immediately dismiss modal so user is never blocked or waiting
    setPreviewModalVisible(false);
    setPreviewImageUri(null);
    setUploadError(null);
    setLastUploadedUri(selectedUri);

    // 2. Optimistic local update — immediate avatar display
    setStagedAvatarUri(selectedUri);
    setEditForm((prev) => ({ ...prev, avatarUri: selectedUri }));

    // 3. Immediately persist locally across active session & storage
    await updateAvatar(selectedUri);

    // 4. Non-blocking background upload with subtle indicator
    setIsUploadingPhoto(true);
    try {
      const uploadResult = await uploadProfilePhotoToServer(user?.id || 'guest', selectedUri);
      if (uploadResult.success) {
        setIsUploadingPhoto(false);
        setUploadSuccessBadge(true);
        setTimeout(() => setUploadSuccessBadge(false), 2500);
      } else {
        setIsUploadingPhoto(false);
        setUploadError(uploadResult.errorMessage || 'Upload failed. Tap to retry.');
      }
    } catch {
      setIsUploadingPhoto(false);
      setUploadError('Upload failed. Tap to retry.');
    }
  };

  // Retry background upload on error
  const handleRetryUpload = async () => {
    const targetUri = lastUploadedUri || user?.avatarUri || stagedAvatarUri;
    if (!targetUri) return;

    setUploadError(null);
    setIsUploadingPhoto(true);
    try {
      const uploadResult = await uploadProfilePhotoToServer(user?.id || 'guest', targetUri);
      if (uploadResult.success) {
        setIsUploadingPhoto(false);
        setUploadSuccessBadge(true);
        setTimeout(() => setUploadSuccessBadge(false), 2500);
      } else {
        setIsUploadingPhoto(false);
        setUploadError(uploadResult.errorMessage || 'Upload failed. Tap to retry.');
      }
    } catch {
      setIsUploadingPhoto(false);
      setUploadError('Upload failed. Tap to retry.');
    }
  };

  // Confirm photo removal
  const handleConfirmRemovePhoto = async () => {
    setRemovePhotoDialogVisible(false);
    setUploadError(null);
    const result = await updateAvatar(null);
    if (result.success) {
      setStagedAvatarUri(null);
      setEditForm((prev) => ({ ...prev, avatarUri: null }));
    } else {
      Alert.alert('Notice', result.message || 'Unable to remove profile photo.');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleteAccountDialogVisible(false);
    const ok = await deleteAccount();
    if (!ok) {
      Alert.alert('Error', 'Could not delete your account. Please try again.');
    }
  };

  // =========================================================================
  // VIEW: EDIT PROFILE SCREEN (Maintained for full functionality)
  // =========================================================================
  if (currentView === 'edit') {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#071421' : '#FFFFFF',
            paddingTop: Math.max(insets.top + 8, 20),
          },
        ]}
      >
        <View
          style={[
            styles.subHeaderBar,
            { borderBottomColor: isDark ? '#1C2F45' : '#F2F4F7' },
          ]}
        >
          <TouchableOpacity
            onPress={() => setCurrentView('settings')}
            style={styles.backButton}
            accessibilityLabel="Back to settings"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? '#FFFFFF' : '#101828'}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.subHeaderTitle,
              { color: isDark ? '#FFFFFF' : '#101828' },
            ]}
          >
            Edit Profile
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.editScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar and Change / Add / Remove Photo */}
          <View style={styles.editAvatarSection}>
            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={styles.editAvatarTouchArea}
              activeOpacity={0.8}
              accessibilityLabel="Change profile picture"
            >
              <View
                style={[
                  styles.editAvatarWrapper,
                  {
                    borderColor: '#FFB900',
                    backgroundColor: isDark ? '#0B1C2A' : '#F2F4F7',
                  },
                ]}
              >
                <Animated.View style={{ opacity: avatarFadeAnim, width: '100%', height: '100%' }}>
                  {(stagedAvatarUri || user?.avatarUri) ? (
                    <Image
                      source={{ uri: (stagedAvatarUri || user?.avatarUri)! }}
                      style={styles.editAvatarImg}
                    />
                  ) : (
                    <View style={styles.editAvatarEmpty}>
                      <Ionicons
                        name="person"
                        size={42}
                        color={isDark ? '#94A3B8' : '#98A2B3'}
                      />
                    </View>
                  )}
                </Animated.View>

                {/* Non-blocking indicator badge: uploading spinner, error, success, or camera */}
                <View
                  style={[
                    styles.editAvatarOverlayBadge,
                    isUploadingPhoto && styles.avatarBadgeLoading,
                    uploadError && styles.avatarBadgeError,
                    uploadSuccessBadge && styles.avatarBadgeSuccess,
                  ]}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size={12} color="#071421" />
                  ) : uploadError ? (
                    <TouchableOpacity onPress={handleRetryUpload} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : uploadSuccessBadge ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={13} color="#071421" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Actions: Change Photo (opens gallery immediately) + Camera + Remove Photo */}
            <View style={styles.editAvatarActionsRow}>
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={[
                  styles.photoActionButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 185, 0, 0.15)' : '#FFF9E6',
                    borderColor: '#FFB900',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(stagedAvatarUri || user?.avatarUri) ? 'images-outline' : 'add-circle-outline'}
                  size={14}
                  color={isDark ? '#FFB900' : '#8A5800'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.photoActionText,
                    { color: isDark ? '#FFB900' : '#8A5800' },
                  ]}
                >
                  {(stagedAvatarUri || user?.avatarUri) ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTakeWithCamera}
                style={[
                  styles.photoActionButton,
                  {
                    backgroundColor: isDark ? '#1C2F45' : '#F2F4F7',
                    borderColor: isDark ? '#263E5A' : '#D0D5DD',
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="camera-outline"
                  size={14}
                  color={isDark ? '#E2E8F0' : '#344054'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.photoActionText,
                    { color: isDark ? '#E2E8F0' : '#344054' },
                  ]}
                >
                  Camera
                </Text>
              </TouchableOpacity>

              {Boolean(stagedAvatarUri || user?.avatarUri) && (
                <TouchableOpacity
                  onPress={() => setRemovePhotoDialogVisible(true)}
                  style={[
                    styles.photoActionButton,
                    styles.removePhotoBtn,
                    {
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECDCA',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF3F2',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color="#EF4444"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Non-blocking background upload retry banner if sync error */}
            {uploadError && (
              <TouchableOpacity
                onPress={handleRetryUpload}
                style={styles.retryUploadBanner}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-offline-outline" size={13} color="#EF4444" style={{ marginRight: 5 }} />
                <Text style={styles.retryUploadText}>{uploadError}</Text>
                <Ionicons name="refresh" size={12} color="#EF4444" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.editForm}>
            <TextInputField
              label="Full Name"
              value={editForm.fullName}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, fullName: text }))}
              placeholder="John Doe"
              error={errors.fullName}
              required
            />

            <TextInputField
              label="Email Address"
              value={user?.email || 'john@example.com'}
              editable={false}
              placeholder="john@example.com"
            />

            <TextInputField
              label="Mobile Number"
              value={editForm.mobileNumber}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, mobileNumber: text }))}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              error={errors.mobileNumber}
              required
            />

            {/* Gender Selection */}
            <View style={styles.genderFieldGroup}>
              <Text
                style={[
                  styles.editFieldLabel,
                  { color: isDark ? '#94A3B8' : '#667085' },
                ]}
              >
                Gender
              </Text>
              <View
                style={[
                  styles.genderRadioRow,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                    borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  },
                ]}
              >
                {(['Male', 'Female', 'Other'] as Gender[]).map((genderOption) => {
                  const isSelected = editForm.gender === genderOption;
                  return (
                    <TouchableOpacity
                      key={genderOption}
                      onPress={() => setEditForm((prev) => ({ ...prev, gender: genderOption }))}
                      style={styles.radioOption}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          { color: isDark ? '#E2E8F0' : '#344054' },
                          isSelected && [styles.radioLabelActive, { color: isDark ? '#FFFFFF' : '#101828' }],
                        ]}
                      >
                        {genderOption}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TextInputField
              label="Address"
              value={editForm.address}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, address: text }))}
              placeholder="123 Main Street, Pune"
              error={errors.address}
              required
            />

            {/* City Selection */}
            <View style={styles.cityFieldGroup}>
              <Text
                style={[
                  styles.editFieldLabel,
                  { color: isDark ? '#94A3B8' : '#667085' },
                ]}
              >
                City
              </Text>
              <TouchableOpacity
                onPress={() => setCityModalVisible(true)}
                style={[
                  styles.citySelectorBox,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                    borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.citySelectorText,
                    { color: isDark ? '#FFFFFF' : '#101828' },
                  ]}
                >
                  {editForm.city || 'Select City'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#667085" />
              </TouchableOpacity>
            </View>

            {/* Save Changes Button */}
            <View style={styles.saveBtnWrapper}>
              <PrimaryButton
                title="Save Changes"
                onPress={handleSaveProfile}
                loading={savingProfile}
                style={styles.saveChangesBtn}
                textStyle={styles.saveChangesBtnText}
              />
            </View>
          </View>
        </ScrollView>

        {/* City Selection Modal */}
        <Modal
          visible={cityModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheetContent,
                { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text
                  style={[
                    styles.modalTitleText,
                    { color: isDark ? '#FFFFFF' : '#101828' },
                  ]}
                >
                  Select City
                </Text>
                <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={POPULAR_CITIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setEditForm((prev) => ({ ...prev, city: item }));
                      setCityModalVisible(false);
                    }}
                    style={[
                      styles.modalListItem,
                      { borderBottomColor: isDark ? '#1C2F45' : '#F2F4F7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalListItemText,
                        { color: isDark ? '#E2E8F0' : '#344054' },
                        editForm.city === item && { color: '#FFB900', fontWeight: '800' },
                      ]}
                    >
                      {item}
                    </Text>
                    {editForm.city === item && (
                      <Ionicons name="checkmark" size={18} color="#FFB900" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // =========================================================================
  // VIEW: MAIN SETTINGS SCREEN (Modern, Minimal, Rounded Cards)
  // =========================================================================
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#071421' : '#F8FAFC',
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20),
        },
      ]}
    >
      {/* 1. Header Bar with Logo and Title */}
      <View
        style={[
          styles.mainHeader,
          {
            backgroundColor: isDark ? '#071421' : '#FFFFFF',
            borderBottomColor: isDark ? '#1C2F45' : '#E4E7EC',
          },
        ]}
      >
        <BrandLogo size="small" horizontal themeOverride={isDark ? 'dark' : 'light'} />
        <Text style={[styles.headerHeading, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.settingsScrollContent,
          {
            paddingBottom: Platform.select({ ios: 110, android: 96, default: 90 }),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Profile Header Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
              borderColor: isDark ? '#1C2F45' : '#E4E7EC',
            },
          ]}
        >
          {/* Top row with circular avatar, name & email, and add photo text if empty */}
          <View style={styles.profileCardTopRow}>
            {/* Circular Profile Avatar — tap opens gallery immediately */}
            <TouchableOpacity
              onPress={handlePickFromGallery}
              onLongPress={() => setPhotoOptionsModalVisible(true)}
              delayLongPress={350}
              style={styles.avatarTouchArea}
              activeOpacity={0.8}
              accessibilityLabel={user?.avatarUri ? 'Change profile photo' : 'Add profile photo'}
              accessibilityHint="Tap to choose from gallery, press and hold for photo options"
            >
              <View
                style={[
                  styles.avatarWrapper,
                  !user?.avatarUri && {
                    borderColor: isDark ? '#1C2F45' : '#D0D5DD',
                    backgroundColor: isDark ? '#102235' : '#F2F4F7',
                  },
                ]}
              >
                <Animated.View style={[{ width: '100%', height: '100%' }, { opacity: avatarFadeAnim }]}>
                  {user?.avatarUri ? (
                    <Image source={{ uri: user.avatarUri }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarEmptyPlaceholder}>
                      <Ionicons
                        name="person"
                        size={30}
                        color={isDark ? '#94A3B8' : '#98A2B3'}
                      />
                    </View>
                  )}
                </Animated.View>

                {/* Non-blocking indicator badge: uploading spinner, error retry, success checkmark, or camera/plus */}
                <View
                  style={[
                    styles.avatarBadge,
                    isUploadingPhoto && styles.avatarBadgeLoading,
                    uploadError && styles.avatarBadgeError,
                    uploadSuccessBadge && styles.avatarBadgeSuccess,
                  ]}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size={10} color="#071421" />
                  ) : uploadError ? (
                    <TouchableOpacity onPress={handleRetryUpload} activeOpacity={0.7}>
                      <Ionicons name="refresh" size={11} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : uploadSuccessBadge ? (
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={user?.avatarUri ? 'camera' : 'add'}
                      size={11}
                      color="#071421"
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Profile Meta Info */}
            <View style={styles.profileMeta}>
              <Text
                style={[
                  styles.profileName,
                  { color: isDark ? '#FFFFFF' : '#101828' },
                ]}
                numberOfLines={1}
              >
                {user?.fullName || 'John Doe'}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  { color: isDark ? '#94A3B8' : '#667085' },
                ]}
                numberOfLines={1}
              >
                {user?.email || 'user@fotoowl.ai'}
              </Text>

              {/* Upload failure retry banner */}
              {uploadError && (
                <TouchableOpacity
                  onPress={handleRetryUpload}
                  style={[
                    styles.retryUploadBanner,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF3F2',
                      borderColor: isDark ? '#EF4444' : '#FECDCA',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text
                    style={[
                      styles.retryUploadText,
                      { color: isDark ? '#FCA5A5' : '#B42318' },
                    ]}
                  >
                    Upload failed · Tap to retry
                  </Text>
                </TouchableOpacity>
              )}

              {/* If user has no profile photo, show default person icon with text "Add Profile Photo" */}
              {!user?.avatarUri && !uploadError && (
                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  style={styles.addPhotoInlineBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Add Profile Photo"
                >
                  <Ionicons
                    name="camera-outline"
                    size={13}
                    color="#FFB900"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.addPhotoInlineText}>Add Profile Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Edit Profile Action Button (Below user's name and email) */}
          <TouchableOpacity
            onPress={handleOpenEdit}
            style={[
              styles.editProfileButtonBelow,
              {
                backgroundColor: isDark ? 'rgba(255, 185, 0, 0.12)' : '#FFF9E6',
                borderColor: '#FFB900',
              },
            ]}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <Ionicons
              name="pencil-outline"
              size={14}
              color={isDark ? '#FFB900' : '#8A5800'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.editProfileButtonTextBelow,
                { color: isDark ? '#FFB900' : '#8A5800' },
              ]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Settings Sections */}

        {/* --- SECTION 1: ACCOUNT --- */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
            ACCOUNT
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            {/* Account Details */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setAccountDetailsModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="person-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Account
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Cloud Tier / Plan */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() =>
                Alert.alert(
                  'Cloud Storage Plan',
                  'You are currently enjoying FotoOwl.AI Free Tier with unlimited event album browsing and on-device private memory creation.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="cloud-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Storage Plan
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValueText, { color: '#FFB900' }]}>Free Tier</Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 2: PERSONALIZATION --- */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
            PERSONALIZATION
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            {/* Favorites */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('FavoritesTab')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="heart-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Favorites
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValueText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  {favoritesCount} {favoritesCount === 1 ? 'photo' : 'photos'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Memories & Moments Preferences */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('HomeTab')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="albums-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Memories & Moments
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 3: GENERAL --- */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
            GENERAL
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            {/* Notifications Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="notifications-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: isDark ? '#1C2F45' : '#E4E7EC', true: '#FFB900' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Language */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="globe-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Language
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValueText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  {selectedLanguage}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Light / Dark Mode Appearance */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons
                    name={isDark ? 'moon-outline' : 'sunny-outline'}
                    size={18}
                    color={isDark ? '#FFB900' : '#F59E0B'}
                  />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Appearance
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValueText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 4: PRIVACY & SECURITY --- */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
            PRIVACY & SECURITY
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            {/* Privacy Protection */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setPrivacyModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Privacy Protection
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValueText, { color: '#10B981', fontWeight: '700' }]}>
                  100% Private
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Gallery Permissions */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="images-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Gallery Permissions
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="open-outline" size={16} color="#98A2B3" />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Password & Security */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setSecurityModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="key-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Password & Security
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 5: SUPPORT --- */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
            SUPPORT
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            {/* Help & Support */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() =>
                Alert.alert(
                  'Help & Support',
                  'Need assistance with FotoOwl.AI? Contact our photography concierge at support@fotoowl.ai or visit https://fotoowl.ai'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="help-circle-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Help & Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* About FotoOwl.AI */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() =>
                Alert.alert(
                  'About FotoOwl.AI',
                  'FotoOwl.AI — AI Event Innovations\nVersion 1.0.0\nDesigned for real-time photography curation, smart indexing, and instant sharing.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="information-circle-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  About FotoOwl.AI
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValueText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  v1.0.0
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() =>
                Alert.alert(
                  'Privacy Policy',
                  'FotoOwl.AI respects your media privacy. All event assets are securely indexed and protected. Device photos remain 100% private.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="document-text-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Privacy Policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Terms of Service */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() =>
                Alert.alert(
                  'Terms of Service',
                  'By using FotoOwl.AI, you agree to our standard event media distribution terms.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]}>
                  <Ionicons name="newspaper-outline" size={18} color={isDark ? '#E2E8F0' : '#344054'} />
                </View>
                <Text style={[styles.rowLabel, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  Terms of Service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 6: ACCOUNT ACTIONS --- */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#667085' }]}>
            ACCOUNT ACTIONS
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            {/* Log Out */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLogoutDialogVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.rowLabel, { color: '#F59E0B', fontWeight: '700' }]}>
                  Log Out
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
            </TouchableOpacity>

            <View style={[styles.cardDivider, { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' }]} />

            {/* Delete Account */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setDeleteAccountDialogVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.rowLabel, { color: '#EF4444', fontWeight: '700' }]}>
                  Delete Account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- MODAL: Appearance Selector --- */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Choose Appearance
            </Text>
            <Text style={[styles.dialogSub, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Select your preferred visual style for FotoOwl.AI.
            </Text>

            {/* Light Mode Option */}
            <TouchableOpacity
              onPress={() => {
                setThemeMode('light');
                setThemeModalVisible(false);
              }}
              style={[
                styles.themeModalOption,
                themeMode === 'light' && styles.themeModalOptionActive,
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="sunny-outline" size={20} color={themeMode === 'light' ? '#FFB900' : '#667085'} />
                <Text
                  style={[
                    styles.themeOptionLabel,
                    { color: isDark ? '#FFFFFF' : '#101828' },
                    themeMode === 'light' && { fontWeight: '800', color: '#FFB900' },
                  ]}
                >
                  Light Mode
                </Text>
              </View>
              {themeMode === 'light' && <Ionicons name="checkmark-circle" size={20} color="#FFB900" />}
            </TouchableOpacity>

            {/* Dark Mode Option */}
            <TouchableOpacity
              onPress={() => {
                setThemeMode('dark');
                setThemeModalVisible(false);
              }}
              style={[
                styles.themeModalOption,
                themeMode === 'dark' && styles.themeModalOptionActive,
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons name="moon-outline" size={20} color={themeMode === 'dark' ? '#FFB900' : '#667085'} />
                <Text
                  style={[
                    styles.themeOptionLabel,
                    { color: isDark ? '#FFFFFF' : '#101828' },
                    themeMode === 'dark' && { fontWeight: '800', color: '#FFB900' },
                  ]}
                >
                  Dark Mode
                </Text>
              </View>
              {themeMode === 'dark' && <Ionicons name="checkmark-circle" size={20} color="#FFB900" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL: Language Selector --- */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheetContent,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                Select Language
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage.startsWith(lang.label.split(' ')[0]);
              return (
                <TouchableOpacity
                  key={lang.id}
                  onPress={() => handleSelectLanguage(lang.label)}
                  style={[
                    styles.modalListItem,
                    { borderBottomColor: isDark ? '#1C2F45' : '#F2F4F7' },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.modalListItemText,
                      { color: isDark ? '#FFFFFF' : '#101828' },
                      isSelected && { color: '#FFB900', fontWeight: '800' },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#FFB900" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* --- MODAL: Account Details --- */}
      <Modal
        visible={accountDetailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountDetailsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAccountDetailsModalVisible(false)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Account Details
            </Text>
            <View style={styles.detailsGroup}>
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                {user?.id || 'demo_user_fotoowl'}
              </Text>

              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                {user?.fullName || 'John Doe'}
              </Text>

              <Text style={styles.detailLabel}>Email</Text>
              <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                {user?.email || 'user@fotoowl.ai'}
              </Text>

              <Text style={styles.detailLabel}>Location</Text>
              <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                {user?.city ? `${user.city}, India` : 'Bangalore, India'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAccountDetailsModalVisible(false)}
              style={styles.dialogCloseBtn}
            >
              <Text style={styles.dialogCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL: Privacy Protection Details --- */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPrivacyModalVisible(false)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.privacyHeader}>
              <Ionicons name="shield-checkmark" size={28} color="#10B981" />
              <Text style={[styles.dialogTitle, { color: isDark ? '#FFFFFF' : '#101828', marginTop: 8 }]}>
                100% Privacy Guarantee
              </Text>
            </View>
            <Text style={[styles.dialogSub, { color: isDark ? '#CBD5E1' : '#475467', textAlign: 'center' }]}>
              FotoOwl.AI reads your device photos strictly via your operating system sandbox.
              Photos remain 100% local on your device and are never uploaded to any server without your explicit action.
            </Text>
            <TouchableOpacity
              onPress={() => setPrivacyModalVisible(false)}
              style={styles.dialogCloseBtn}
            >
              <Text style={styles.dialogCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL: Password & Security Details --- */}
      <Modal
        visible={securityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSecurityModalVisible(false)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Password & Security
            </Text>
            <Text style={[styles.dialogSub, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Your session is authenticated securely using encrypted token storage.
            </Text>
            <View style={styles.detailsGroup}>
              <Text style={styles.detailLabel}>Authentication Status</Text>
              <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '700' }]}>
                Active & Verified
              </Text>

              <Text style={styles.detailLabel}>Security Algorithm</Text>
              <Text style={[styles.detailValue, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                AES-GCM Local Token Storage
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSecurityModalVisible(false)}
              style={styles.dialogCloseBtn}
            >
              <Text style={styles.dialogCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- CONFIRMATION: Log Out --- */}
      <ConfirmationDialog
        visible={logoutDialogVisible}
        title="Log Out"
        message="Are you sure you want to log out from FotoOwl.AI?"
        confirmText="Log Out"
        cancelText="Cancel"
        confirmVariant="primary"
        icon={null}
        onConfirm={async () => {
          setLogoutDialogVisible(false);
          await logout();
        }}
        onCancel={() => setLogoutDialogVisible(false)}
      />

      {/* --- CONFIRMATION: Delete Account --- */}
      <ConfirmationDialog
        visible={deleteAccountDialogVisible}
        title="Delete Account"
        message="Are you sure you want to permanently delete your FotoOwl.AI account? All your profile information, preferences, and session tokens will be permanently erased."
        confirmText="Delete Account"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="alert-circle"
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteAccountDialogVisible(false)}
      />

      {/* --- PREVIEW MODAL: Profile Picture Confirmation --- */}
      <ProfilePhotoPreviewModal
        visible={previewModalVisible}
        imageUri={previewImageUri}
        loading={isUploadingPhoto}
        onConfirm={handleConfirmPreviewPhoto}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewImageUri(null);
        }}
        onChangePhoto={handlePickFromGallery}
      />

      {/* --- ACTION SHEET: Choose / Change / Remove Profile Photo --- */}
      <Modal
        visible={photoOptionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoOptionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setPhotoOptionsModalVisible(false)}
        >
          <View
            style={[
              styles.actionSheetContent,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.actionSheetHandle} />
            <Text
              style={[
                styles.actionSheetTitle,
                { color: isDark ? '#FFFFFF' : '#101828' },
              ]}
            >
              Profile Photo
            </Text>
            <Text
              style={[
                styles.actionSheetSubtitle,
                { color: isDark ? '#94A3B8' : '#667085' },
              ]}
            >
              Select an image from your device gallery or snap a photo.
            </Text>

            {/* Option: Device Gallery */}
            <TouchableOpacity
              onPress={handlePickFromGallery}
              style={[
                styles.actionSheetOption,
                { borderBottomColor: isDark ? '#1C2F45' : '#F2F4F7' },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionOptionIconWrap,
                  { backgroundColor: isDark ? '#1C2F45' : '#FFF9E6' },
                ]}
              >
                <Ionicons name="images-outline" size={20} color="#FFB900" />
              </View>
              <View style={styles.actionOptionTextGroup}>
                <Text
                  style={[
                    styles.actionOptionLabel,
                    { color: isDark ? '#FFFFFF' : '#101828' },
                  ]}
                >
                  Choose from Device Gallery
                </Text>
                <Text
                  style={[
                    styles.actionOptionHint,
                    { color: isDark ? '#94A3B8' : '#667085' },
                  ]}
                >
                  Native device picker with 1:1 square cropping
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Option: Camera */}
            <TouchableOpacity
              onPress={handleTakeWithCamera}
              style={[
                styles.actionSheetOption,
                { borderBottomColor: isDark ? '#1C2F45' : '#F2F4F7' },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionOptionIconWrap,
                  { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' },
                ]}
              >
                <Ionicons name="camera-outline" size={20} color={isDark ? '#E2E8F0' : '#344054'} />
              </View>
              <View style={styles.actionOptionTextGroup}>
                <Text
                  style={[
                    styles.actionOptionLabel,
                    { color: isDark ? '#FFFFFF' : '#101828' },
                  ]}
                >
                  Take Photo with Camera
                </Text>
                <Text
                  style={[
                    styles.actionOptionHint,
                    { color: isDark ? '#94A3B8' : '#667085' },
                  ]}
                >
                  Snap a new picture using your camera
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Option: Remove Photo (if set) */}
            {Boolean(user?.avatarUri || stagedAvatarUri) && (
              <TouchableOpacity
                onPress={() => {
                  setPhotoOptionsModalVisible(false);
                  setRemovePhotoDialogVisible(true);
                }}
                style={[
                  styles.actionSheetOption,
                  { borderBottomColor: isDark ? '#1C2F45' : '#F2F4F7' },
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionOptionIconWrap,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF3F2' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <View style={styles.actionOptionTextGroup}>
                  <Text style={[styles.actionOptionLabel, { color: '#EF4444' }]}>
                    Remove Profile Photo
                  </Text>
                  <Text
                    style={[
                      styles.actionOptionHint,
                      { color: isDark ? '#94A3B8' : '#667085' },
                    ]}
                  >
                    Reset back to default person icon
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setPhotoOptionsModalVisible(false)}
              style={[
                styles.actionSheetCancelBtn,
                { backgroundColor: isDark ? '#1C2F45' : '#F2F4F7' },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.actionSheetCancelText,
                  { color: isDark ? '#FFFFFF' : '#344054' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- CONFIRMATION: Remove Photo --- */}
      <ConfirmationDialog
        visible={removePhotoDialogVisible}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile picture? This will reset your avatar to the default person icon."
        confirmText="Remove Photo"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="trash-outline"
        onConfirm={handleConfirmRemovePhoto}
        onCancel={() => setRemovePhotoDialogVisible(false)}
      />
    </View>
  );
};

// Export SettingsScreen alias for easy direct importation
export const SettingsScreen = ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  settingsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarTouchArea: {
    position: 'relative',
    marginRight: 14,
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarEmptyPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFB900',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeLoading: {
    backgroundColor: '#FFB900',
    borderColor: '#FFFFFF',
  },
  avatarBadgeError: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
  },
  avatarBadgeSuccess: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
  },
  retryUploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  retryUploadText: {
    fontSize: 11.5,
    fontWeight: '700',
    marginLeft: 4,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  addPhotoInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  addPhotoInlineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFB900',
  },
  editProfileButtonBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  editProfileButtonTextBelow: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValueText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    marginLeft: 62,
  },
  editScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  editAvatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatarTouchArea: {
    position: 'relative',
    marginBottom: 8,
  },
  editAvatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarImg: {
    width: '100%',
    height: '100%',
  },
  editAvatarEmpty: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarOverlayBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFB900',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  photoActionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  removePhotoBtn: {
    paddingHorizontal: 12,
  },
  removePhotoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  editForm: {
    width: '100%',
  },
  editFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  genderFieldGroup: {
    marginBottom: 16,
  },
  genderRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioCircleActive: {
    borderColor: '#FFB900',
    backgroundColor: '#FFB900',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  radioLabel: {
    fontSize: 14,
  },
  radioLabelActive: {
    fontWeight: '700',
  },
  cityFieldGroup: {
    marginBottom: 20,
  },
  citySelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  citySelectorText: {
    fontSize: 15,
  },
  saveBtnWrapper: {
    marginTop: 10,
  },
  saveChangesBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFB900',
  },
  saveChangesBtnText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  themeModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  themeModalOptionActive: {
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSheetContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalListItemText: {
    fontSize: 15,
  },
  detailsGroup: {
    marginVertical: 10,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#667085',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogCloseBtn: {
    backgroundColor: '#FFB900',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  dialogCloseBtnText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 14,
  },
  privacyHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 33, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5DD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  actionOptionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOptionTextGroup: {
    flex: 1,
  },
  actionOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionOptionHint: {
    fontSize: 11.5,
    marginTop: 2,
  },
  actionSheetCancelBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
