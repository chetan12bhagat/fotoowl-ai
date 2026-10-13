import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MemoryPerson, MemoryPhotoItem, CreateMemoryInput, MemoryThemeColor } from '../types/memory';
import { MEMORY_THEMES } from '../services/memoriesService';
import { fetchPhotosApi } from '../services/api';
import { Photo } from '../types/photo';
import { useTheme } from '../hooks/useTheme';

interface CreateMemoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CreateMemoryInput) => Promise<{ success: boolean; message?: string }>;
  availablePeople: MemoryPerson[];
}

const CATEGORIES = [
  'Holiday',
  'Travel',
  'Birthday',
  'Family',
  'Wedding',
  'Celebration',
  'Sports',
  'Corporate',
];

const THEME_OPTIONS: { id: string; label: string; theme: MemoryThemeColor; color: string }[] = [
  { id: 'amber', label: 'Gold Amber', theme: MEMORY_THEMES.amber, color: '#F59E0B' },
  { id: 'sky', label: 'Sky Blue', theme: MEMORY_THEMES.sky, color: '#0284C7' },
  { id: 'rose', label: 'Warm Rose', theme: MEMORY_THEMES.rose, color: '#E11D48' },
  { id: 'lavender', label: 'Lavender', theme: MEMORY_THEMES.lavender, color: '#9333EA' },
  { id: 'emerald', label: 'Emerald', theme: MEMORY_THEMES.emerald, color: '#16A34A' },
];

export const CreateMemoryModal: React.FC<CreateMemoryModalProps> = ({
  visible,
  onClose,
  onSave,
  availablePeople,
}) => {
  const { isDark } = useTheme();

  // Form states
  const [title, setTitle] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [category, setCategory] = useState('Celebration');
  const [description, setDescription] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('amber');
  const [selectedPhotos, setSelectedPhotos] = useState<MemoryPhotoItem[]>([]);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState('');

  // Account photos picker states
  const [accountPhotosModalVisible, setAccountPhotosModalVisible] = useState(false);
  const [accountPhotos, setAccountPhotos] = useState<Photo[]>([]);
  const [loadingAccountPhotos, setLoadingAccountPhotos] = useState(false);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize defaults when opened
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDateRange(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      setCategory('Celebration');
      setDescription('');
      setSelectedThemeId('amber');
      setSelectedPhotos([]);
      setSelectedPeopleIds([]);
      setNewPersonName('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  // Load authorized FotoOwl cloud photos on demand
  const handleOpenAccountPhotos = async () => {
    setAccountPhotosModalVisible(true);
    if (accountPhotos.length === 0) {
      setLoadingAccountPhotos(true);
      try {
        const photos = await fetchPhotosApi(1, 24);
        setAccountPhotos(photos);
      } catch (err) {
        console.warn('Failed to load FotoOwl account photos:', err);
      } finally {
        setLoadingAccountPhotos(false);
      }
    }
  };

  // Pick photos from device library
  const handlePickFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 20,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: MemoryPhotoItem[] = result.assets.map((asset, index) => ({
          id: `local_mem_${Date.now()}_${index}`,
          uri: asset.uri,
          thumbnailUri: asset.uri,
          title: asset.fileName || `Photo ${Date.now()}`,
          source: 'device',
          dateAdded: new Date().toISOString(),
          width: asset.width || 1200,
          height: asset.height || 1200,
        }));

        setSelectedPhotos((prev) => [...prev, ...newItems]);
      }
    } catch (err: any) {
      console.error('Image picker error:', err);
      Alert.alert('Permission Notice', 'Could not open device photo picker.');
    }
  };

  // Toggle photo selection from FotoOwl Account photos
  const handleToggleAccountPhoto = (photo: Photo) => {
    const isAlreadySelected = selectedPhotos.some((p) => p.id === `acc_${photo.id}`);
    if (isAlreadySelected) {
      setSelectedPhotos((prev) => prev.filter((p) => p.id !== `acc_${photo.id}`));
    } else {
      const newItem: MemoryPhotoItem[] = [
        {
          id: `acc_${photo.id}`,
          uri: photo.download_url || photo.url,
          thumbnailUri: photo.download_url || photo.url,
          title: photo.title || photo.author || 'FotoOwl Cloud Photo',
          source: 'fotoowl',
          dateAdded: new Date().toISOString(),
          width: photo.width,
          height: photo.height,
        },
      ];
      setSelectedPhotos((prev) => [...prev, ...newItem]);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleTogglePerson = (personId: string) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleAddNewPerson = () => {
    if (!newPersonName.trim()) return;
    const name = newPersonName.trim();
    const tempId = `custom_person_${Date.now()}`;
    const newPerson: MemoryPerson = {
      id: tempId,
      name,
      initials: name.slice(0, 2).toUpperCase(),
    };
    availablePeople.push(newPerson);
    setSelectedPeopleIds((prev) => [...prev, tempId]);
    setNewPersonName('');
  };

  // Submit memory creation
  const handleSave = async () => {
    setErrorMessage(null);
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setErrorMessage('Please enter a memory title.');
      return;
    }

    if (cleanTitle.length < 3) {
      setErrorMessage('Memory title must be at least 3 characters long.');
      return;
    }

    if (selectedPhotos.length === 0) {
      setErrorMessage('Please select at least one photo for this memory.');
      return;
    }

    setIsSubmitting(true);

    const chosenTheme = THEME_OPTIONS.find((t) => t.id === selectedThemeId)?.theme || MEMORY_THEMES.amber;
    const chosenPeople = availablePeople.filter((p) => selectedPeopleIds.includes(p.id));

    const input: CreateMemoryInput = {
      title: cleanTitle,
      dateRange: dateRange.trim() || 'Recently Added',
      category,
      description: description.trim() || undefined,
      photos: selectedPhotos,
      people: chosenPeople,
      isShared: true,
      themeColor: chosenTheme,
    };

    const res = await onSave(input);
    setIsSubmitting(false);

    if (res.success) {
      Alert.alert('Memory Created', `"${cleanTitle}" has been saved to your memories dashboard.`);
      onClose();
    } else {
      setErrorMessage(res.message || 'Failed to create memory.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? '#1C2F45' : '#E4E7EC',
              paddingTop: Platform.OS === 'ios' ? 50 : 20,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
            Create Memory
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[styles.saveHeaderBtn, isSubmitting && { opacity: 0.6 }]}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#071421" />
            ) : (
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Title Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              Memory Title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Christmas Party, Trip to Paris"
              placeholderTextColor={isDark ? '#64748B' : '#98A2B3'}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#0B1C2A' : '#F8FAFC',
                  borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  color: isDark ? '#FFFFFF' : '#101828',
                },
              ]}
              autoFocus={true}
            />
          </View>

          {/* Date Range Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              Date Range or Event Date
            </Text>
            <TextInput
              value={dateRange}
              onChangeText={setDateRange}
              placeholder="e.g., Dec 24 - Dec 25, 2025"
              placeholderTextColor={isDark ? '#64748B' : '#98A2B3'}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#0B1C2A' : '#F8FAFC',
                  borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  color: isDark ? '#FFFFFF' : '#101828',
                },
              ]}
            />
          </View>

          {/* Category Chips */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                    style={[
                      styles.chip,
                      isSelected
                        ? { backgroundColor: '#FFB900', borderColor: '#FFB900' }
                        : {
                            backgroundColor: isDark ? '#0B1C2A' : '#F2F4F7',
                            borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected
                          ? { color: '#071421', fontWeight: '800' }
                          : { color: isDark ? '#94A3B8' : '#667085' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Theme Color Swatches */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              Card Accent Color
            </Text>
            <View style={styles.themeSwatchesRow}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = selectedThemeId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setSelectedThemeId(opt.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.swatchItem,
                      {
                        backgroundColor: opt.color,
                        borderColor: isSelected ? (isDark ? '#FFFFFF' : '#071421') : 'transparent',
                        borderWidth: isSelected ? 3 : 0,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Photos Selection Section */}
          <View style={styles.formGroup}>
            <View style={styles.photosSectionHeader}>
              <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054', marginBottom: 0 }]}>
                Photos ({selectedPhotos.length} selected) <Text style={styles.requiredStar}>*</Text>
              </Text>
              {selectedPhotos.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedPhotos([])}>
                  <Text style={styles.clearPhotosText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action buttons to choose source */}
            <View style={styles.photoSourceButtonsRow}>
              <TouchableOpacity
                onPress={handlePickFromDevice}
                style={[
                  styles.photoSourceBtn,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                    borderColor: '#FFB900',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name="phone-portrait-outline" size={18} color="#FFB900" style={{ marginRight: 6 }} />
                <Text style={[styles.photoSourceBtnText, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  From Device
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenAccountPhotos}
                style={[
                  styles.photoSourceBtn,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                    borderColor: '#FFB900',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name="cloud-outline" size={18} color="#FFB900" style={{ marginRight: 6 }} />
                <Text style={[styles.photoSourceBtnText, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  From FotoOwl Cloud
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected Photos Horizontal Preview */}
            {selectedPhotos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedPhotosList}
              >
                {selectedPhotos.map((item, idx) => (
                  <View key={item.id} style={styles.selectedThumbContainer}>
                    <Image source={{ uri: item.uri }} style={styles.selectedThumbImage} />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(item.id)}
                      style={styles.removeThumbBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                    {idx < 3 && (
                      <View style={styles.coverPill}>
                        <Text style={styles.coverPillText}>Cover #{idx + 1}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View
                style={[
                  styles.photosPlaceholderBox,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#F8FAFC',
                    borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  },
                ]}
              >
                <Ionicons name="images-outline" size={32} color="#94A3B8" />
                <Text style={[styles.placeholderText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  No photos selected yet. Tap above to add photos from device or FotoOwl cloud.
                </Text>
              </View>
            )}
          </View>

          {/* People Section */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              Tag People
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleSelectRow}>
              {availablePeople.map((person) => {
                const isSelected = selectedPeopleIds.includes(person.id);
                return (
                  <TouchableOpacity
                    key={person.id}
                    onPress={() => handleTogglePerson(person.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.personSelectChip,
                      isSelected
                        ? { backgroundColor: '#FFB900', borderColor: '#FFB900' }
                        : {
                            backgroundColor: isDark ? '#0B1C2A' : '#F2F4F7',
                            borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                          },
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'person-circle-outline'}
                      size={18}
                      color={isSelected ? '#071421' : isDark ? '#94A3B8' : '#667085'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.personSelectText,
                        isSelected
                          ? { color: '#071421', fontWeight: '800' }
                          : { color: isDark ? '#FFFFFF' : '#344054' },
                      ]}
                    >
                      {person.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick add custom person */}
            <View style={styles.addPersonInputRow}>
              <TextInput
                value={newPersonName}
                onChangeText={setNewPersonName}
                placeholder="Or type another person's name..."
                placeholderTextColor={isDark ? '#64748B' : '#98A2B3'}
                style={[
                  styles.addPersonInput,
                  {
                    backgroundColor: isDark ? '#0B1C2A' : '#F8FAFC',
                    borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                    color: isDark ? '#FFFFFF' : '#101828',
                  },
                ]}
              />
              <TouchableOpacity
                onPress={handleAddNewPerson}
                style={styles.addPersonBtn}
                disabled={!newPersonName.trim()}
              >
                <Ionicons name="add" size={20} color="#071421" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#344054' }]}>
              Notes / Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What made this moment unforgettable?"
              placeholderTextColor={isDark ? '#64748B' : '#98A2B3'}
              multiline
              numberOfLines={3}
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: isDark ? '#0B1C2A' : '#F8FAFC',
                  borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                  color: isDark ? '#FFFFFF' : '#101828',
                },
              ]}
            />
          </View>

          {/* Big Action Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[styles.bigSaveBtn, isSubmitting && { opacity: 0.7 }]}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#071421" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#071421" style={{ marginRight: 8 }} />
                <Text style={styles.bigSaveBtnText}>Save to Memories</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal: Select from FotoOwl Account Photos */}
        <Modal
          visible={accountPhotosModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setAccountPhotosModalVisible(false)}
        >
          <View style={[styles.container, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: isDark ? '#1C2F45' : '#E4E7EC',
                  paddingTop: Platform.OS === 'ios' ? 50 : 20,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setAccountPhotosModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                FotoOwl Event Photos
              </Text>
              <TouchableOpacity
                onPress={() => setAccountPhotosModalVisible(false)}
                style={styles.saveHeaderBtn}
              >
                <Text style={styles.saveHeaderBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            {loadingAccountPhotos ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#FFB900" />
                <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#667085' }]}>
                  Loading authorized event photos...
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.accountPhotosGrid}>
                {accountPhotos.map((photo) => {
                  const isChecked = selectedPhotos.some((p) => p.id === `acc_${photo.id}`);
                  return (
                    <TouchableOpacity
                      key={photo.id}
                      onPress={() => handleToggleAccountPhoto(photo)}
                      activeOpacity={0.8}
                      style={[
                        styles.accountPhotoGridItem,
                        isChecked && styles.accountPhotoGridItemActive,
                      ]}
                    >
                      <Image source={{ uri: photo.download_url }} style={styles.accountPhotoImage} />
                      <View style={[styles.checkCircle, isChecked && styles.checkCircleActive]}>
                        {isChecked && <Ionicons name="checkmark" size={14} color="#071421" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  saveHeaderBtn: {
    backgroundColor: '#FFB900',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 64,
    alignItems: 'center',
  },
  saveHeaderBtnText: {
    color: '#071421',
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeSwatchesRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 6,
  },
  swatchItem: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearPhotosText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  photoSourceButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoSourceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  photoSourceBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedPhotosList: {
    gap: 10,
    paddingVertical: 6,
  },
  selectedThumbContainer: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#FFB900',
  },
  selectedThumbImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#FFB900',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  coverPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#071421',
  },
  photosPlaceholderBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  peopleSelectRow: {
    gap: 8,
    paddingVertical: 4,
  },
  personSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  personSelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addPersonInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  addPersonInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addPersonBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textAreaInput: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  bigSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB900',
    height: 52,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  bigSaveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071421',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  accountPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
  },
  accountPhotoGridItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  accountPhotoGridItemActive: {
    borderWidth: 3,
    borderColor: '#FFB900',
  },
  accountPhotoImage: {
    width: '100%',
    height: '100%',
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#FFB900',
    borderColor: '#071421',
  },
});
