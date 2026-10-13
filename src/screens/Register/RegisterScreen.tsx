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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { Gender, RegistrationFormData } from '../../types/user';
import { BrandLogo } from '../../components/BrandLogo';
import { TextInputField } from '../../components/TextInputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../hooks/useAuth';
import { POPULAR_CITIES } from '../../constants/cities';
import { validateRegistrationForm, FormErrors } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const GENDER_OPTIONS: Gender[] = ['Male', 'Female', 'Other'];

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    gender: 'Male',
    mobileNumber: '',
    address: '',
    city: 'Select City',
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
    const dataToValidate = {
      ...formData,
      city: formData.city === 'Select City' ? '' : formData.city,
    };
    const validationErrors = validateRegistrationForm(dataToValidate);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const result = await register({
      ...formData,
      city: formData.city === 'Select City' ? 'Bangalore' : formData.city,
    });
    setLoading(false);

    if (result.success && result.requireVerification) {
      navigation.navigate('VerifyEmail', {
        email: result.email || formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
      });
    } else if (!result.success) {
      setGeneralError(result.message || 'Registration failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenContainer}
    >
      {/* Top Header Bar matching Reference Image 2 */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Centered Brand Logo */}
        <View style={styles.logoSection}>
          <BrandLogo size="medium" showTagline themeOverride="light" />
        </View>

        {/* General Error Banner */}
        {generalError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.errorBannerText}>{generalError}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <TextInputField
            label="Full Name"
            placeholder="John Doe"
            value={formData.fullName}
            onChangeText={(val) => updateField('fullName', val)}
            leftIcon="person-outline"
            error={errors.fullName}
            required
          />

          {/* Email Address */}
          <TextInputField
            label="Email Address"
            placeholder="john@example.com"
            value={formData.email}
            onChangeText={(val) => updateField('email', val)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
            required
          />

          {/* Gender Selector with radio buttons */}
          <View style={styles.genderContainer}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderInputWrapper}>
              <Ionicons
                name="people-outline"
                size={20}
                color="#667085"
                style={styles.genderLeadIcon}
              />
              <View style={styles.radioGroup}>
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = formData.gender === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => updateField('gender', option)}
                      activeOpacity={0.7}
                      style={styles.radioOption}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          isSelected && styles.radioLabelSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {errors.gender && <Text style={styles.inlineError}>{errors.gender}</Text>}
          </View>

          {/* Mobile Number */}
          <TextInputField
            label="Mobile Number"
            placeholder="9876543210"
            value={formData.mobileNumber}
            onChangeText={(val) => {
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
            label="Address"
            placeholder="123, MG Road, Near Park"
            value={formData.address}
            onChangeText={(val) => updateField('address', val)}
            leftIcon="location-outline"
            error={errors.address}
            required
          />

          {/* City Dropdown Selector */}
          <View style={styles.cityFieldContainer}>
            <Text style={styles.fieldLabel}>City</Text>
            <TouchableOpacity
              onPress={() => setCityModalVisible(true)}
              style={[
                styles.citySelector,
                errors.city && styles.citySelectorError,
              ]}
              activeOpacity={0.75}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color="#667085"
                style={styles.cityIcon}
              />
              <Text
                style={[
                  styles.citySelectorText,
                  formData.city === 'Select City' && styles.cityPlaceholder,
                ]}
              >
                {formData.city}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#667085" />
            </TouchableOpacity>
            {errors.city && <Text style={styles.inlineError}>{errors.city}</Text>}
          </View>

          {/* Password */}
          <TextInputField
            label="Password"
            placeholder="••••••••••"
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
            placeholder="••••••••••"
            value={formData.confirmPassword}
            onChangeText={(val) => updateField('confirmPassword', val)}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
            required
          />

          {/* Full-width Gold Create Account Button */}
          <View style={styles.createBtnWrapper}>
            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.createButton}
              textStyle={styles.createButtonText}
            />
          </View>
        </View>

        {/* Footer Link to Login */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* City Picker Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cityModalContent}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select City</Text>
              <TouchableOpacity
                onPress={() => setCityModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#101828" />
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
                      isSelected && styles.cityItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cityItemText,
                        isSelected && styles.cityItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#FFB900" />
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667085',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  genderLeadIcon: {
    marginRight: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
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
  radioCircleSelected: {
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
    color: '#344054',
  },
  radioLabelSelected: {
    fontWeight: '600',
    color: '#101828',
  },
  cityFieldContainer: {
    marginBottom: 16,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  citySelectorError: {
    borderColor: '#EF4444',
  },
  cityIcon: {
    marginRight: 10,
  },
  citySelectorText: {
    flex: 1,
    fontSize: 15,
    color: '#101828',
  },
  cityPlaceholder: {
    color: '#98A2B3',
  },
  inlineError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  createBtnWrapper: {
    width: '100%',
    marginTop: 10,
  },
  createButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFB900',
  },
  createButtonText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#667085',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFB900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 33, 0.6)',
    justifyContent: 'flex-end',
  },
  cityModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '65%',
  },
  cityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EC',
  },
  cityModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  modalCloseBtn: {
    padding: 4,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  cityItemSelected: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
  },
  cityItemText: {
    fontSize: 15,
    color: '#101828',
  },
  cityItemTextSelected: {
    fontWeight: '700',
    color: '#D97706',
  },
});
