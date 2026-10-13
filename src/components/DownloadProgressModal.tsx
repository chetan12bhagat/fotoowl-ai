import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DownloadProgressModalProps {
  visible: boolean;
  progress: number; // 0 to 100
  onCancel: () => void;
  statusMessage?: string;
  isComplete?: boolean;
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  visible,
  progress,
  onCancel,
  statusMessage = 'Saving to your gallery',
  isComplete = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && !isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, isComplete, pulseAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Circular Progress Ring matching Reference Image 1 */}
          <Animated.View
            style={[
              styles.circleContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.outerRing}>
              {/* Gold Progress Track Ring */}
              <View style={styles.innerContent}>
                {isComplete ? (
                  <Ionicons name="checkmark-circle" size={44} color="#FFB900" />
                ) : (
                  <Text style={styles.percentageText}>
                    {Math.min(100, Math.max(0, Math.round(progress)))}%
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Status Headings matching Reference Image 1 */}
          <Text style={styles.statusTitle}>
            {isComplete ? 'Download Complete!' : 'Downloading...'}
          </Text>
          <Text style={styles.statusSubtitle}>{statusMessage}</Text>

          {/* Cancel Button */}
          {!isComplete && (
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelButton}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 33, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  circleContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  outerRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 28, 42, 0.75)',
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1C2F45',
    backgroundColor: '#0B1C2A',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
