import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { BrandLogo } from '../../components/BrandLogo';
import { TextInputField } from '../../components/TextInputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { isValidEmail } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setGeneralError(result.message || 'Invalid login credentials.');
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@fotoowl.ai');
    setPassword('password123');
    setErrors({});
    setGeneralError(null);
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
        {/* Top Brand Header */}
        <View style={styles.brandHeader}>
          <BrandLogo size="medium" showTagline />
          <Text
            style={[
              styles.welcomeTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Welcome Back
          </Text>
          <Text
            style={[
              styles.welcomeSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Sign in to explore your AI media & photo gallery
          </Text>
        </View>

        {/* General Error Banner */}
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

        {/* Login Form Fields */}
        <View style={styles.formContainer}>
          <TextInputField
            label="Email Address"
            placeholder="e.g. user@example.com"
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
            placeholder="Enter your password"
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

          <View style={styles.actionSection}>
            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              icon="log-in-outline"
            />

            {/* Quick Demo Account Button */}
            <TouchableOpacity
              onPress={handleFillDemo}
              style={[
                styles.demoButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.demoButtonText,
                  { color: theme.colors.accent },
                ]}
              >
                Auto-fill Demo Credentials
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Link to Register */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Don't have an account yet?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.footerLink,
                { color: theme.colors.primary },
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 18,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  actionSection: {
    marginTop: 8,
    gap: 12,
  },
  demoButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
