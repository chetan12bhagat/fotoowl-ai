import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { BrandLogo } from '../../components/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, seedDemoAccount } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Ensure demo account exists in local database for seamless evaluation
    seedDemoAccount().catch(() => {});
  }, [fadeAnim, scaleAnim, seedDemoAccount]);

  useEffect(() => {
    if (isLoading) return;

    // Small delay for branding immersion (800ms) then route based on auth
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // AppNavigator handles switching to Main stack automatically when isAuthenticated is true
      } else {
        navigation.replace('Login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <BrandLogo
          size="large"
          showTagline
          taglineText="Every Moment, Beautifully Captured"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
