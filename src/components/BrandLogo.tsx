import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  taglineText?: string;
  horizontal?: boolean;
  themeOverride?: 'light' | 'dark';
}

/**
 * Official FotoOwl.AI Brand Logo Component matching Reference Images 1 & 2.
 * Renders "FOTO OWL" with the iconic owl-eye emblem connecting the Os,
 * with golden accents and "AI EVENT INNOVATIONS" tagline.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'medium',
  showTagline = true,
  taglineText = 'AI EVENT INNOVATIONS',
  horizontal = false,
  themeOverride,
}) => {
  const { theme, isDark: systemIsDark } = useTheme();
  const isDark = themeOverride ? themeOverride === 'dark' : systemIsDark;

  const fontColor = isDark ? '#FFFFFF' : '#071421';
  const goldColor = '#FFB900';

  // Dimension scaling
  const config = {
    small: {
      fontSize: 16,
      eyeSize: 13,
      pupilSize: 5,
      beakWidth: 5,
      beakHeight: 4,
      taglineSize: 7,
      letterSpacing: 2,
      containerGap: 2,
    },
    medium: {
      fontSize: 26,
      eyeSize: 20,
      pupilSize: 8,
      beakWidth: 7,
      beakHeight: 6,
      taglineSize: 10,
      letterSpacing: 3.5,
      containerGap: 4,
    },
    large: {
      fontSize: 36,
      eyeSize: 28,
      pupilSize: 11,
      beakWidth: 10,
      beakHeight: 8,
      taglineSize: 13,
      letterSpacing: 4.5,
      containerGap: 6,
    },
  }[size];

  return (
    <View style={[styles.container, horizontal ? styles.rowContainer : styles.colContainer]}>
      {/* Brand Name with Owl-Eyes Motif */}
      <View style={styles.logoRow}>
        {/* "FOT" in primary font color */}
        <Text style={[styles.brandText, { fontSize: config.fontSize, color: fontColor }]}>
          FOT
        </Text>

        {/* Embedded Owl Eyes Emblem for the "O"s */}
        <View style={[styles.owlEyesWrapper, { height: config.eyeSize, marginHorizontal: 1 }]}>
          {/* Ear Tuft Left */}
          <View
            style={[
              styles.earTuftLeft,
              {
                borderBottomColor: isDark ? '#FFFFFF' : '#071421',
                borderLeftWidth: config.eyeSize * 0.22,
                borderRightWidth: config.eyeSize * 0.22,
                borderBottomWidth: config.eyeSize * 0.35,
                top: -config.eyeSize * 0.25,
                left: config.eyeSize * 0.1,
              },
            ]}
          />

          {/* Left Eye (O of FOTO) */}
          <View
            style={[
              styles.eyeCircle,
              {
                width: config.eyeSize,
                height: config.eyeSize,
                borderRadius: config.eyeSize / 2,
                borderColor: isDark ? '#FFFFFF' : '#071421',
                borderWidth: Math.max(1.8, config.eyeSize * 0.1),
                backgroundColor: isDark ? '#071421' : '#FFFFFF',
              },
            ]}
          >
            <View
              style={[
                styles.pupil,
                {
                  width: config.pupilSize,
                  height: config.pupilSize,
                  borderRadius: config.pupilSize / 2,
                  backgroundColor: fontColor,
                },
              ]}
            />
          </View>

          {/* Central Downward Golden Beak */}
          <View
            style={[
              styles.beak,
              {
                borderTopColor: goldColor,
                borderLeftWidth: config.beakWidth / 2,
                borderRightWidth: config.beakWidth / 2,
                borderTopWidth: config.beakHeight,
                bottom: -config.beakHeight * 0.45,
              },
            ]}
          />

          {/* Right Eye (O of OWL) */}
          <View
            style={[
              styles.eyeCircle,
              {
                width: config.eyeSize,
                height: config.eyeSize,
                borderRadius: config.eyeSize / 2,
                borderColor: goldColor,
                borderWidth: Math.max(1.8, config.eyeSize * 0.1),
                backgroundColor: isDark ? '#071421' : '#FFFFFF',
              },
            ]}
          >
            <View
              style={[
                styles.pupil,
                {
                  width: config.pupilSize,
                  height: config.pupilSize,
                  borderRadius: config.pupilSize / 2,
                  backgroundColor: goldColor,
                },
              ]}
            />
          </View>

          {/* Ear Tuft Right */}
          <View
            style={[
              styles.earTuftRight,
              {
                borderBottomColor: goldColor,
                borderLeftWidth: config.eyeSize * 0.22,
                borderRightWidth: config.eyeSize * 0.22,
                borderBottomWidth: config.eyeSize * 0.35,
                top: -config.eyeSize * 0.25,
                right: config.eyeSize * 0.1,
              },
            ]}
          />
        </View>

        {/* "WL" in Warm Golden Yellow */}
        <Text style={[styles.brandText, { fontSize: config.fontSize, color: goldColor }]}>
          WL
        </Text>
      </View>

      {/* Official Tagline: "AI EVENT INNOVATIONS" */}
      {showTagline && (
        <Text
          style={[
            styles.tagline,
            {
              fontSize: config.taglineSize,
              letterSpacing: config.letterSpacing,
              color: fontColor,
              marginTop: config.containerGap,
              opacity: isDark ? 0.95 : 0.85,
            },
          ]}
        >
          {taglineText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  owlEyesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 1,
  },
  eyeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0.5,
  },
  pupil: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  beak: {
    position: 'absolute',
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 10,
  },
  earTuftLeft: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-18deg' }],
    zIndex: 5,
  },
  earTuftRight: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '18deg' }],
    zIndex: 5,
  },
  tagline: {
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
