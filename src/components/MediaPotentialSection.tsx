import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export const MediaPotentialSection: React.FC = () => {
  const { isDark } = useTheme();

  const handleStartFree = () => {
    Alert.alert(
      'FotoOwl.AI Free Tier',
      'Start sharing wedding and event galleries with AI face recognition and same-night delivery.'
    );
  };

  const handleViewPricing = () => {
    Alert.alert(
      'FotoOwl.AI Plans',
      'Flexible photographer plans starting at $0 for up to 3 events with unlimited guest face searches.'
    );
  };

  return (
    <View style={styles.outerWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#071421' : '#F7F9FC',
            borderColor: isDark ? '#1C2F45' : '#E4E7EC',
          },
        ]}
      >
        {/* Badge matching website reference */}
        <View style={styles.pillBadge}>
          <Text style={styles.pillBadgeText}>Built for Wedding & Event Photographers</Text>
        </View>

        {/* Section Heading & Subtitle */}
        <Text style={[styles.heading, { color: isDark ? '#FFFFFF' : '#101828' }]}>
          Unlock the True Potential of Your Media Assets
        </Text>
        <Text style={[styles.subheading, { color: isDark ? '#94A3B8' : '#667085' }]}>
          Capture and distribute the precious moments.
        </Text>

        {/* Feature Cards Grid */}
        <View style={styles.featuresRow}>
          <View
            style={[
              styles.featureCard,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.featureIconContainer}>
              <Ionicons name="scan-outline" size={20} color="#FFB900" />
            </View>
            <Text style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              AI Face Matching
            </Text>
            <Text style={[styles.featureDesc, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Guests find their photos in seconds using AI face recognition selfies.
            </Text>
          </View>

          <View
            style={[
              styles.featureCard,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.featureIconContainer}>
              <Ionicons name="flash-outline" size={20} color="#FFB900" />
            </View>
            <Text style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Same-Night Delivery
            </Text>
            <Text style={[styles.featureDesc, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Deliver high-resolution galleries before the reception ends.
            </Text>
          </View>

          <View
            style={[
              styles.featureCard,
              { backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.featureIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#FFB900" />
            </View>
            <Text style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
              Custom Branding
            </Text>
            <Text style={[styles.featureDesc, { color: isDark ? '#94A3B8' : '#667085' }]}>
              Personalize every gallery with your photography studio logo & theme.
            </Text>
          </View>
        </View>

        {/* Action CTA Buttons matching website screenshot */}
        <View style={styles.ctaButtonRow}>
          <TouchableOpacity
            style={styles.startFreeButton}
            onPress={handleStartFree}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Start free with FotoOwl.AI"
          >
            <Text style={styles.startFreeButtonText}>Start Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewPricingButton,
              {
                borderColor: isDark ? '#1C2F45' : '#D0D5DD',
                backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
              },
            ]}
            onPress={handleViewPricing}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View pricing plans"
          >
            <Text style={[styles.viewPricingButtonText, { color: isDark ? '#FFFFFF' : '#344054' }]}>
              View Pricing
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 1080,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  pillBadge: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 0, 0.4)',
    backgroundColor: 'rgba(255, 185, 0, 0.08)',
    marginBottom: 12,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB900',
    letterSpacing: -0.1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 22,
  },
  featureCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  ctaButtonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  startFreeButton: {
    backgroundColor: '#FFB900',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  startFreeButtonText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 14,
  },
  viewPricingButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewPricingButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
