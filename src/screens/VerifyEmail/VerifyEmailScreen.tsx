import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyEmailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { verifyEmail, resendOtp } = useAuth();

  const email = route.params?.email || 'user@fotoowl.ai';
  const fullName = route.params?.fullName || '';

  // 6-digit OTP states
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer & UI states
  const [countdown, setCountdown] = useState<number>(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'incorrect' | 'expired' | 'network' | 'general' | null>(null);
  const [isSuccessState, setIsSuccessState] = useState<boolean>(false);

  // Success check animation
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  // Countdown timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Handle single digit change or full paste
  const handleDigitChange = (value: string, index: number) => {
    setErrorMessage(null);
    setErrorType(null);

    // If user pasted multi-digit string (e.g. 6-digit code or iOS autofill)
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const newDigits = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < Math.min(cleaned.length, OTP_LENGTH); i++) {
        newDigits[i] = cleaned[i];
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(cleaned.length, OTP_LENGTH - 1);
      setFocusedIndex(focusIndex);
      inputRefs.current[focusIndex]?.focus();

      // If full 6 digits were pasted, submit automatically
      if (cleaned.length >= OTP_LENGTH) {
        submitOtp(newDigits.join(''));
      }
      return;
    }

    // Single digit input
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < OTP_LENGTH - 1) {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        setFocusedIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Submit OTP for validation
  const submitOtp = async (codeToVerify?: string) => {
    if (verifying || isSuccessState) return;

    setErrorMessage(null);
    setErrorType(null);

    const fullCode = codeToVerify || otpDigits.join('');
    if (fullCode.length < OTP_LENGTH) {
      setErrorType('general');
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setVerifying(true);
    try {
      const result = await verifyEmail(email, fullCode);
      setVerifying(false);

      if (result.success) {
        // Trigger success animation
        setIsSuccessState(true);
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(checkOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        const msg = result.message || '';
        if (msg.toLowerCase().includes('expired')) {
          setErrorType('expired');
          setErrorMessage('This verification code has expired. Please request a new code.');
        } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('connection')) {
          setErrorType('network');
          setErrorMessage('Network connection error. Please check your internet and retry.');
        } else {
          setErrorType('incorrect');
          setErrorMessage(msg || 'Incorrect verification code. Please check and try again.');
        }
      }
    } catch (err: any) {
      setVerifying(false);
      setErrorType('network');
      setErrorMessage(err.message || 'Unable to connect to FotoOwl AI servers. Please retry.');
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const result = await resendOtp(email);
      setResending(false);

      if (result.success) {
        setCountdown(result.cooldownSeconds || RESEND_COOLDOWN_SECONDS);
        // Clear input boxes
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setFocusedIndex(0);
        inputRefs.current[0]?.focus();
      } else {
        setErrorType('general');
        setErrorMessage(result.message || 'Could not resend verification code. Please wait.');
      }
    } catch (err: any) {
      setResending(false);
      setErrorType('network');
      setErrorMessage(err.message || 'Failed to resend code due to network error.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: isDark ? '#071421' : '#F8FAFC' }]}
    >
      {/* Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Verify Email
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Official FotoOwl AI Logo Asset */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/fotoowl-logo.png')}
            style={styles.officialLogo}
            resizeMode="contain"
            accessibilityLabel="FotoOwl AI Logo"
          />
          <Text style={[styles.brandSubheading, { color: isDark ? '#94A3B8' : '#667085' }]}>
            AI Event Memories & Gallery
          </Text>
        </View>

        {/* Main Verification Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
              borderColor: isDark ? '#1C2F45' : '#E4E7EC',
            },
          ]}
        >
          {isSuccessState ? (
            /* Polished Success State View */
            <View style={styles.successContainer}>
              <Animated.View
                style={[
                  styles.successIconWrapper,
                  {
                    transform: [{ scale: checkScale }],
                    opacity: checkOpacity,
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={72} color="#10B981" />
              </Animated.View>
              <Text style={[styles.successHeading, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                Email verified successfully
              </Text>
              <Text style={[styles.successSubtext, { color: isDark ? '#94A3B8' : '#667085' }]}>
                Welcome to FotoOwl AI! Preparing your personalized event workspace...
              </Text>
              <ActivityIndicator size="small" color="#FFB900" style={{ marginTop: 20 }} />
            </View>
          ) : (
            /* Standard OTP Entry Form */
            <>
              {/* Envelope Badge */}
              <View style={styles.badgeWrapper}>
                <View style={styles.badgeCircle}>
                  <Ionicons name="mail-open-outline" size={28} color="#071421" />
                </View>
              </View>

              {/* Headings */}
              <Text style={[styles.mainHeading, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                Verify your email
              </Text>
              <Text style={[styles.supportingText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                One quick step to get started with FotoOwl AI.
              </Text>

              {/* Email Address Tag */}
              <View style={styles.emailContainer}>
                <Ionicons name="mail" size={13} color="#8A5800" style={{ marginRight: 6 }} />
                <Text style={styles.emailText} numberOfLines={1}>
                  {email}
                </Text>
              </View>

              {/* Dynamic Error State Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons
                    name={errorType === 'network' ? 'cloud-offline-outline' : 'alert-circle'}
                    size={18}
                    color="#D92D20"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Six OTP Input Boxes */}
              <View style={styles.otpRow}>
                {otpDigits.map((digit, index) => {
                  const isFilled = digit.length > 0;
                  const isFocused = focusedIndex === index;

                  return (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? OTP_LENGTH : 1}
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      selectTextOnFocus
                      accessibilityLabel={`Digit ${index + 1} of verification code`}
                      style={[
                        styles.otpBox,
                        {
                          backgroundColor: isDark ? '#102235' : '#F8FAFC',
                          borderColor: isFocused
                            ? '#FFB900'
                            : isFilled
                            ? isDark
                              ? '#FFB900'
                              : '#D97706'
                            : isDark
                            ? '#1C2F45'
                            : '#D0D5DD',
                          color: isDark ? '#FFFFFF' : '#101828',
                        },
                        isFocused && styles.otpBoxFocused,
                        isFilled && styles.otpBoxFilled,
                      ]}
                      textAlign="center"
                      placeholder="•"
                      placeholderTextColor={isDark ? '#475467' : '#98A2B3'}
                    />
                  );
                })}
              </View>

              {/* Validity Note */}
              <View style={styles.expiryNoteRow}>
                <Ionicons name="time-outline" size={14} color="#FFB900" style={{ marginRight: 5 }} />
                <Text style={[styles.expiryText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  Code is valid for 5 minutes
                </Text>
              </View>

              {/* Primary Action Button */}
              <View style={styles.buttonWrapper}>
                <PrimaryButton
                  title="Verify & Continue"
                  onPress={() => submitOtp()}
                  loading={verifying}
                  disabled={otpDigits.join('').length < OTP_LENGTH || verifying}
                />
              </View>

              {/* Resend Code Section */}
              <View style={styles.resendSection}>
                <Text style={[styles.resendPrompt, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  Didn't receive the code?
                </Text>

                {canResend ? (
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending}
                    activeOpacity={0.7}
                    style={styles.resendBtn}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color="#FFB900" />
                    ) : (
                      <Text style={styles.resendBtnText}>Resend Code</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.cooldownBadge}>
                    <Ionicons name="hourglass-outline" size={13} color="#8A5800" style={{ marginRight: 4 }} />
                    <Text style={styles.cooldownText}>
                      Resend code in {countdown}s
                    </Text>
                  </View>
                )}
              </View>

              {/* Subtle Spam Folder Note */}
              <View style={styles.spamNoteRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={isDark ? '#94A3B8' : '#667085'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.spamNoteText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  Didn't receive the code? Check your spam folder.
                </Text>
              </View>

              {/* Option to Return and Change Email */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.editEmailBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={14} color="#667085" style={{ marginRight: 4 }} />
                <Text style={[styles.editEmailText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  Wrong email? Return to edit
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  officialLogo: {
    width: 170,
    height: 50,
  },
  brandSubheading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeWrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  supportingText: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 16,
  },
  emailText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8A5800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#B42318',
    flex: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 10,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderWidth: 2,
    borderColor: '#FFB900',
    backgroundColor: 'rgba(255, 185, 0, 0.05)',
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 2,
  },
  otpBoxFilled: {
    backgroundColor: 'rgba(255, 185, 0, 0.08)',
  },
  expiryNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginBottom: 16,
  },
  resendSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  resendPrompt: {
    fontSize: 13,
    marginBottom: 6,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFB900',
  },
  cooldownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cooldownText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8A5800',
  },
  spamNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  spamNoteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  editEmailText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIconWrapper: {
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});
