import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '../types/photo';

export interface ImageShareSheetModalProps {
  visible: boolean;
  photo: Photo;
  onClose: () => void;
  onNativeShare: () => void;
  onSaveToPhotos: () => void;
  onAddToSharedAlbum: () => void;
}

export const ImageShareSheetModal: React.FC<ImageShareSheetModalProps> = ({
  visible,
  photo,
  onClose,
  onNativeShare,
  onSaveToPhotos,
  onAddToSharedAlbum,
}) => {
  const thumbnailUrl =
    photo.download_url || `https://picsum.photos/id/${photo.id}/200/200`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Top Drag Handle Indicator */}
              <View style={styles.handle} />

              {/* Photo Preview & Author Info matching Reference Image 1 */}
              <View style={styles.photoHeaderRow}>
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>Share Photo</Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    ID: {photo.id} by {photo.author}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Share Destinations Row matching Reference Image 1 */}
              <View style={styles.appsRow}>
                <TouchableOpacity
                  onPress={onNativeShare}
                  style={styles.appItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="radio-outline" size={22} color="#0284C7" />
                  </View>
                  <Text style={styles.appLabel}>AirDrop</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onNativeShare}
                  style={styles.appItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="chatbubble" size={20} color="#16A34A" />
                  </View>
                  <Text style={styles.appLabel}>Messages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onNativeShare}
                  style={styles.appItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="mail" size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.appLabel}>Mail</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onNativeShare}
                  style={styles.appItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.appIconCircle, { backgroundColor: '#F1F5F9' }]}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#475569" />
                  </View>
                  <Text style={styles.appLabel}>More</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Action Rows matching Reference Image 1 */}
              <TouchableOpacity
                onPress={onSaveToPhotos}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="download-outline" size={20} color="#101828" />
                  <Text style={styles.actionText}>Save to Photos</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onAddToSharedAlbum}
                style={styles.actionRow}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="albums-outline" size={20} color="#101828" />
                  <Text style={styles.actionText}>Add to Shared Album</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 20, 33, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E7EC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#667085',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 12,
  },
  appsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  appItem: {
    alignItems: 'center',
  },
  appIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  appLabel: {
    fontSize: 12,
    color: '#344054',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#101828',
  },
  cancelButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#344054',
  },
});
