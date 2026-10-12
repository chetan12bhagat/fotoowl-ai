import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { Gender, RegistrationFormData } from '../../types/user';
import { BrandLogo } from '../../components/BrandLogo';
import { TextInputField } from '../../components/TextInputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { POPULAR_CITIES } from '../../constants/cities';
import { validateRegistrationForm, FormErrors } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const GENDER_OPTIONS: Gender[] = ['Male', 'Female', 'Other'];

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    gender: 'Male',
    mobileNumber: '',
    address: '',
    city: 'Bangalore',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const updateField = (field: keyof RegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleRegister = async () => {
    setGeneralError(null);
    const validationErrors = validateRegistrationForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (!result.success) {
      setGeneralError(result.message || 'Registration failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.brandHeader}>
          <BrandLogo size="medium" />
          <Text
            style={[
              styles.screenTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Create an Account
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Join FotoOwl.AI to curate, organize, and download event photos
          </Text>
        </View>

        {/* Error Banner */}
        {generalError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                borderColor: theme.colors.error,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>
              {generalError}
            </Text>
          </View>
        )}

        {/* Registration Form */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <TextInputField
            label="Full Name"
            placeholder="e.g. Maya Sharma"
            value={formData.fullName}
            onChangeText={(val) => updateField('fullName', val)}
            leftIcon="person-outline"
            error={errors.fullName}
            required
          />

          {/* Email Address */}
          <TextInputField
            label="Email Address"
            placeholder="e.g. maya@fotoowl.ai"
            value={formData.email}
            onChangeText={(val) => updateField('email', val)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
            required
          />

          {/* Gender Radio Buttons */}
          <View style={styles.genderContainer}>
            <View style={styles.labelRow}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Gender Selection
              </Text>
              <Text style={[styles.required, { color: theme.colors.error }]}> *</Text>
            </View>

            <View style={styles.radioGroup}>
              {GENDER_OPTIONS.map((option) => {
                const isSelected = formData.gender === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => updateField('gender', option)}
                    activeOpacity={0.7}
                    style={[
                      styles.radioButton,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.surfaceElevated
                          : theme.colors.inputBackground,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioDot,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        {
                          color: isSelected
                            ? theme.colors.textPrimary
                            : theme.colors.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.gender && (
              <Text style={[styles.inlineError, { color: theme.colors.error }]}>
                {errors.gender}
              </Text>
            )}
          </View>

          {/* Mobile Number (Numeric, 10 digits) */}
          <TextInputField
            label="Mobile Number (10 Digits)"
            placeholder="e.g. 9876543210"
            value={formData.mobileNumber}
            onChangeText={(val) => {
              // Only allow numeric input
              const numericOnly = val.replace(/[^0-9]/g, '');
              updateField('mobileNumber', numericOnly);
            }}
            keyboardType="number-pad"
            maxLength={10}
            leftIcon="call-outline"
            error={errors.mobileNumber}
            required
          />

          {/* Address */}
          <TextInputField
            label="Street Address"
            placeholder="e.g. 104 Willow Residency, 4th Cross"
            value={formData.address}
            onChangeText={(val) => updateField('address', val)}
            leftIcon="location-outline"
            error={errors.address}
            required
          />

          {/* City Dropdown Selector */}
          <View style={styles.dropdownContainer}>
            <View style={styles.labelRow}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                City
              </Text>
              <Text style={[styles.required, { color: theme.colors.error }]}> *</Text>
            </View>

            <TouchableOpacity
              onPress={() => setCityModalVisible(true)}
              style={[
                styles.citySelector,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: errors.city
                    ? theme.colors.error
                    : theme.colors.inputBorder,
                },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={theme.colors.textMuted}
                style={styles.cityIcon}
              />
              <Text
                style={[
                  styles.citySelectorText,
                  {
                    color: formData.city
                      ? theme.colors.textPrimary
                      : theme.colors.placeholderText,
                  },
                ]}
              >
                {formData.city || 'Select your city'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>

            {errors.city && (
              <Text style={[styles.inlineError, { color: theme.colors.error }]}>
                {errors.city}
              </Text>
            )}
          </View>

          {/* Password (>= 6 chars) */}
          <TextInputField
            label="Password (min 6 characters)"
            placeholder="Create password"
            value={formData.password}
            onChangeText={(val) => updateField('password', val)}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.password}
            required
          />

          {/* Confirm Password */}
          <TextInputField
            label="Confirm Password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChangeText={(val) => updateField('confirmPassword', val)}
            isPassword
            leftIcon="shield-checkmark-outline"
            error={errors.confirmPassword}
            required
          />

          {/* Register Submit Button */}
          <View style={styles.submitSection}>
            <PrimaryButton
              title="Register & Get Started"
              onPress={handleRegister}
              loading={loading}
              icon="person-add-outline"
            />
          </View>
        </View>

        {/* Footer Link to Login */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Already registered?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.footerLink,
                { color: theme.colors.primary },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.cityModalContent,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.cityModalHeader}>
              <Text
                style={[
                  styles.cityModalTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Select City
              </Text>
              <TouchableOpacity
                onPress={() => setCityModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={POPULAR_CITIES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = formData.city === item;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      updateField('city', item);
                      setCityModalVisible(false);
                    }}
                    style={[
                      styles.cityItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.surfaceElevated
                          : 'transparent',
                        borderBottomColor: theme.colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cityItemText,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.textPrimary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 14,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 290,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
  },
  genderContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  required: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  radioLabel: {
    fontSize: 13,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  cityIcon: {
    marginRight: 8,
  },
  citySelectorText: {
    flex: 1,
    fontSize: 15,
  },
  inlineError: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  submitSection: {
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cityModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '65%',
  },
  cityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  cityModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  cityItemText: {
    fontSize: 15,
  },
});
