import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { BrandLogo } from '../../components/BrandLogo';
import { LogoOnlyLoadingScreen } from '../../components/LogoOnlyLoadingScreen';
import { TextInputField } from '../../components/TextInputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { isValidEmail } from '../../utils/validation';
import { getRegisteredUsers } from '../../storage/asyncStorage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLogoSuccessScreen, setShowLogoSuccessScreen] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email format.';
    }

    if (!password.trim()) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    setGeneralError(null);
    if (!validate()) return;

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const result = await login(cleanEmail, cleanPassword);
      setLoading(false);

      if (result.success) {
        // Successfully logged in; AppNavigator will transition to Main
      } else if (result.requireVerification) {
        // Account unverified; redirect to VerifyEmail screen
        navigation.navigate('VerifyEmail', {
          email: result.email || cleanEmail,
        });
      } else {
        setGeneralError(result.message || 'Login failed. Please verify your credentials.');
      }
    } catch {
      setLoading(false);
      setGeneralError('An unexpected error occurred during login. Please try again.');
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@fotoowl.ai');
    setPassword('password123');
    setErrors({});
    setGeneralError(null);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'If an account exists with this email address, password reset instructions will be sent.',
      [{ text: 'OK' }]
    );
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Connecting to Google single sign-on for FotoOwl.AI event portals.',
      [
        {
          text: 'Fill Demo Account',
          onPress: handleFillDemo,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (showLogoSuccessScreen) {
    return <LogoOnlyLoadingScreen backgroundColor="#FFFFFF" />;
  }

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
        <Text style={styles.headerTitle}>Login</Text>
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

        {/* Headings matching Reference Image 2 */}
        <View style={styles.headingSection}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>Login to continue to your account</Text>
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
          <TextInputField
            label="Email Address"
            placeholder="john@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              if (generalError) setGeneralError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
            required
          />

          <TextInputField
            label="Password"
            placeholder="••••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (generalError) setGeneralError(null);
            }}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.password}
            required
          />

          {/* Remember Me and Forgot Password Row */}
          <View style={styles.rememberForgotRow}>
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberMeContainer}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxActive,
                ]}
              >
                {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Full-Width Gold Login Button */}
          <View style={styles.loginBtnWrapper}>
            <PrimaryButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
            />
          </View>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue with Google Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            style={styles.googleButton}
          >
            <View style={styles.googleIconWrapper}>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Quick Demo Fill Pill */}
          <TouchableOpacity
            onPress={handleFillDemo}
            activeOpacity={0.7}
            style={styles.demoFillBtn}
          >
            <Text style={styles.demoFillText}>Fill Demo Credentials (demo@fotoowl.ai)</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link to Create Account */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginTop: 10,
    marginBottom: 24,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#667085',
    marginTop: 6,
    letterSpacing: -0.1,
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
  rememberForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    borderColor: '#FFB900',
    backgroundColor: '#FFB900',
  },
  rememberMeText: {
    fontSize: 13,
    color: '#344054',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#FFB900',
    fontWeight: '600',
  },
  loginBtnWrapper: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFB900',
  },
  loginButtonText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4E7EC',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#98A2B3',
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconWrapper: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#344054',
  },
  demoFillBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  demoFillText: {
    fontSize: 12,
    color: '#667085',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
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
});
