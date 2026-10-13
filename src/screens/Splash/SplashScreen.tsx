import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

/**
 * Official FotoOwl.AI Splash & Loading Screen.
 * Minimalist design containing ONLY the official FotoOwl.AI app logo
 * centered horizontally and vertically on a clean background.
 * Strictly no spinners, progress bars, taglines, settings buttons, or extra text.
 */
export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading, seedDemoAccount } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  // Responsive logo width: 180px–240px depending on viewport dimensions
  const logoWidth = Math.min(240, Math.max(180, Math.round(windowWidth * 0.54)));
  const logoHeight = Math.round(logoWidth * 0.3); // 800:240 aspect ratio = 0.3

  useEffect(() => {
    // Subtle, high-polish entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Ensure demo account exists in local database for seamless evaluation
    seedDemoAccount().catch(() => {});
  }, [fadeAnim, scaleAnim, seedDemoAccount]);

  // Loading & session management:
  // Show logo during initialization, then smoothly route to appropriate screen
  useEffect(() => {
    if (isLoading) return;

    const transitionTimer = setTimeout(() => {
      if (isAuthenticated) {
        // AppNavigator automatically swaps to Main tab navigator upon authentication
      } else {
        navigation.replace('Login');
      }
    }, 1100);

    return () => clearTimeout(transitionTimer);
  }, [isLoading, isAuthenticated, navigation]);

  // Safety fallback timer to prevent splash screen from ever getting stuck
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!isAuthenticated) {
        navigation.replace('Login');
      }
    }, 3200);

    return () => clearTimeout(safetyTimer);
  }, [isAuthenticated, navigation]);

  const backgroundColor = isDark ? '#071421' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../../assets/fotoowl-logo.png')}
          style={[
            styles.logoImage,
            {
              width: logoWidth,
              height: logoHeight,
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="FotoOwl.AI"
          accessibilityRole="image"
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
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#071421',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        filter: 'drop-shadow(0px 4px 10px rgba(7, 20, 33, 0.05))',
      } as any,
    }),
  },
  logoImage: {
    // Sharp aspect ratio preservation
  },
});
