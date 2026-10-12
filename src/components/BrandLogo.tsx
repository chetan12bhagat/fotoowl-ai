import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  taglineText?: string;
  horizontal?: boolean;
}

/**
 * Reusable FotoOwl.AI Brand Logo Component.
 * Features a modern, geometric owl emblem combining camera optics and AI precision.
 * (Note: Placeholder vector brand emblem for FotoOwl.AI until official company vector is supplied).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'medium',
  showTagline = false,
  taglineText = 'Every Moment, Beautifully Captured',
  horizontal = false,
}) => {
  const { theme } = useTheme();

  // Dimension scaling
  const dimensions = {
    small: { iconContainer: 34, iconSize: 18, titleSize: 16, tagSize: 10, pupilSize: 5 },
    medium: { iconContainer: 50, iconSize: 26, titleSize: 22, tagSize: 12, pupilSize: 7 },
    large: { iconContainer: 76, iconSize: 40, titleSize: 28, tagSize: 13, pupilSize: 10 },
  }[size];

  return (
    <View style={[styles.container, horizontal ? styles.row : styles.column]}>
      {/* Owl & Camera Aperture Emblem */}
      <View
        style={[
          styles.emblemContainer,
          {
            width: dimensions.iconContainer,
            height: dimensions.iconContainer,
            borderRadius: dimensions.iconContainer / 2,
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.primary,
            borderWidth: 2,
          },
        ]}
      >
        {/* Stylized Owl Feather/Ear accents */}
        <View style={styles.earLeft} />
        <View style={styles.earRight} />

        {/* Central Camera / Owl Eye lens */}
        <View
          style={[
            styles.lensOuter,
            {
              width: dimensions.iconContainer * 0.65,
              height: dimensions.iconContainer * 0.65,
              borderRadius: (dimensions.iconContainer * 0.65) / 2,
              backgroundColor: theme.colors.primaryDark,
            },
          ]}
        >
          {/* Owl Dual Eyes / Aperture Core */}
          <View style={styles.eyesRow}>
            <View
              style={[
                styles.eyePupil,
                {
                  width: dimensions.pupilSize,
                  height: dimensions.pupilSize,
                  borderRadius: dimensions.pupilSize / 2,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
            <View
              style={[
                styles.eyePupil,
                {
                  width: dimensions.pupilSize,
                  height: dimensions.pupilSize,
                  borderRadius: dimensions.pupilSize / 2,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* AI Dot Accent */}
        <View
          style={[
            styles.aiSpark,
            {
              backgroundColor: theme.colors.accentAmber,
            },
          ]}
        />
      </View>

      {/* Typography */}
      <View style={[styles.textBlock, horizontal && styles.textBlockHorizontal]}>
        <View style={styles.brandTitleRow}>
          <Text
            style={[
              styles.brandTextPrimary,
              {
                fontSize: dimensions.titleSize,
                color: theme.colors.textPrimary,
              },
            ]}
          >
            FotoOwl
          </Text>
          <Text
            style={[
              styles.brandTextAi,
              {
                fontSize: dimensions.titleSize,
                color: theme.colors.primary,
              },
            ]}
          >
            .AI
          </Text>
        </View>

        {showTagline && (
          <Text
            style={[
              styles.tagline,
              {
                fontSize: dimensions.tagSize,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {taglineText}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  earLeft: {
    position: 'absolute',
    top: -3,
    left: '20%',
    width: 6,
    height: 6,
    backgroundColor: '#06B6D4',
    borderTopLeftRadius: 4,
  },
  earRight: {
    position: 'absolute',
    top: -3,
    right: '20%',
    width: 6,
    height: 6,
    backgroundColor: '#06B6D4',
    borderTopRightRadius: 4,
  },
  lensOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePupil: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  aiSpark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  textBlockHorizontal: {
    alignItems: 'flex-start',
    marginTop: 0,
    marginLeft: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTextPrimary: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandTextAi: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tagline: {
    marginTop: 2,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
