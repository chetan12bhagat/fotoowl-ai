import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';

export interface LogoOnlyLoadingScreenProps {
  backgroundColor?: string;
  themeOverride?: 'light' | 'dark';
}

/**
 * Strict Logo-Only Loading Screen.
 * Contains ONLY the centered official FotoOwl.AI app logo against a plain background.
 * Absolutely no spinners, loading text, progress bars, taglines, or additional icons.
 */
export const LogoOnlyLoadingScreen: React.FC<LogoOnlyLoadingScreenProps> = ({
  backgroundColor = '#FFFFFF',
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Responsive logo width: 180px–240px depending on viewport dimensions
  const logoWidth = Math.min(240, Math.max(180, Math.round(windowWidth * 0.54)));
  const logoHeight = Math.round(logoWidth * 0.3); // 800:240 aspect ratio = 0.3

  useEffect(() => {
    // Subtle, smooth fade-in animation for the centered logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/fotoowl-logo.png')}
          style={[styles.logoImage, { width: logoWidth, height: logoHeight }]}
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logoWrapper: {
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
    // Preserves aspect ratio
  },
});
