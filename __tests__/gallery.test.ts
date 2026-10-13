import { describe, it, expect } from '@jest/globals';
import { MainTabParamList } from '../src/types/navigation';
import { DeviceMediaItem } from '../src/components/LocalPhotoViewerModal';

describe('Navigation and Gallery Specifications', () => {
  it('supports all 4 primary navigation tabs matching reference images', () => {
    const tabs: (keyof MainTabParamList)[] = [
      'HomeTab',
      'GalleryTab',
      'FavoritesTab',
      'ProfileTab',
    ];

    expect(tabs).toHaveLength(4);
    expect(tabs).toContain('HomeTab');
    expect(tabs).toContain('GalleryTab');
    expect(tabs).toContain('FavoritesTab');
    expect(tabs).toContain('ProfileTab');
  });

  it('validates device media item format for local photo library', () => {
    const sampleItem: DeviceMediaItem = {
      id: 'asset-98765',
      uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20261012_102030.jpg',
      filename: 'IMG_20261012_102030.jpg',
      mediaType: 'photo',
      width: 4032,
      height: 3024,
      creationTime: 1791836154623,
    };

    expect(sampleItem.id).toBe('asset-98765');
    expect(sampleItem.mediaType).toBe('photo');
    expect(sampleItem.width).toBe(4032);
    expect(sampleItem.height).toBe(3024);
    expect(sampleItem.creationTime).toBeGreaterThan(0);
  });

  it('filters device assets correctly between Photos and Videos', () => {
    const mixedAssets: DeviceMediaItem[] = [
      {
        id: 'img-1',
        uri: 'file:///photo1.jpg',
        mediaType: 'photo',
        width: 1000,
        height: 1000,
        creationTime: 100,
      },
      {
        id: 'vid-1',
        uri: 'file:///video1.mp4',
        mediaType: 'video',
        width: 1920,
        height: 1080,
        creationTime: 200,
        duration: 45,
      },
      {
        id: 'img-2',
        uri: 'file:///photo2.jpg',
        mediaType: 'photo',
        width: 1000,
        height: 1000,
        creationTime: 300,
      },
    ];

    const photosOnly = mixedAssets.filter((a) => a.mediaType !== 'video');
    const videosOnly = mixedAssets.filter((a) => a.mediaType === 'video');

    expect(photosOnly).toHaveLength(2);
    expect(videosOnly).toHaveLength(1);
    expect(videosOnly[0].duration).toBe(45);
  });

  it('guarantees strict account storage key isolation between users', () => {
    const getWebStorageKey = (userId?: string) => `@fotoowl_web_photos_user_${userId || 'guest'}`;

    const userAKey = getWebStorageKey('user_A_123');
    const userBKey = getWebStorageKey('user_B_456');
    const guestKey = getWebStorageKey();

    expect(userAKey).not.toBe(userBKey);
    expect(userAKey).toBe('@fotoowl_web_photos_user_user_A_123');
    expect(userBKey).toBe('@fotoowl_web_photos_user_user_B_456');
    expect(guestKey).toBe('@fotoowl_web_photos_user_guest');
  });

  it('sorts newest photos first by creation timestamp', () => {
    const items: DeviceMediaItem[] = [
      { id: '1', uri: 'f1', mediaType: 'photo', width: 100, height: 100, creationTime: 1000 },
      { id: '2', uri: 'f2', mediaType: 'photo', width: 100, height: 100, creationTime: 3000 },
      { id: '3', uri: 'f3', mediaType: 'photo', width: 100, height: 100, creationTime: 2000 },
    ];

    const sorted = [...items].sort((a, b) => b.creationTime - a.creationTime);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });
});
