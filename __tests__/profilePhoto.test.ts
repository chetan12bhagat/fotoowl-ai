import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorage[key] = value;
  }),
  getItem: jest.fn(async (key: string) => {
    return mockStorage[key] || null;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete mockStorage[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.default,
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  getMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));

import * as ImagePicker from 'expo-image-picker';
import {
  validateProfileImageAsset,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
  pickProfilePhotoFromGallery,
  takeProfilePhotoWithCamera,
  uploadProfilePhotoToServer,
} from '../src/services/profilePhotoService';
import {
  saveRegisteredUser,
  getRegisteredUsers,
  updateUserProfileInRegistry,
  saveAuthSession,
  getAuthSession,
} from '../src/storage/asyncStorage';
import { User, AuthSession, ProfileUpdateData } from '../src/types/user';

describe('Profile Picture Selection & Device Gallery Tests', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  describe('Image Asset Validation', () => {
    it('accepts valid JPEG, PNG, and WebP photo URIs within size limits', () => {
      const validJpg = validateProfileImageAsset({
        uri: 'file:///var/mobile/Containers/Data/Application/123/tmp/photo.jpg',
        fileSize: 2 * 1024 * 1024, // 2MB
        mimeType: 'image/jpeg',
      });
      expect(validJpg.isValid).toBe(true);
      expect(validJpg.error).toBeUndefined();

      const validPng = validateProfileImageAsset({
        uri: 'ph://ED7AC36B-A150-4C38-BB8C-B6D696F6F282/L0/001',
        fileSize: 4.5 * 1024 * 1024,
        mimeType: 'image/png',
      });
      expect(validPng.isValid).toBe(true);

      const validWebP = validateProfileImageAsset({
        uri: 'content://media/external/images/media/4912.webp',
        fileSize: 1.2 * 1024 * 1024,
        mimeType: 'image/webp',
      });
      expect(validWebP.isValid).toBe(true);
    });

    it('rejects oversized photos exceeding the 10 MB limit gracefully', () => {
      const oversized = validateProfileImageAsset({
        uri: 'file:///large_photo.jpg',
        fileSize: 12 * 1024 * 1024, // 12 MB
        mimeType: 'image/jpeg',
      });
      expect(oversized.isValid).toBe(false);
      expect(oversized.error).toContain('exceeds the maximum limit of 10 MB');
    });

    it('rejects unsupported or non-image mime types', () => {
      const invalidMime = validateProfileImageAsset({
        uri: 'file:///document.pdf',
        fileSize: 500 * 1024,
        mimeType: 'application/pdf',
      });
      expect(invalidMime.isValid).toBe(false);
      expect(invalidMime.error).toContain('not a valid image format');
    });

    it('rejects empty or missing asset uri', () => {
      const emptyUri = validateProfileImageAsset({
        uri: '',
      });
      expect(emptyUri.isValid).toBe(false);
      expect(emptyUri.error).toContain('No image file was selected');
    });
  });

  describe('User Profile Photo Persistence & Data Isolation', () => {
    it('persists selected avatarUri across user registry and active session', async () => {
      const testUser: User = {
        id: 'user_profile_1',
        fullName: 'Elena Rostova',
        email: 'elena@fotoowl.ai',
        gender: 'Female',
        mobileNumber: '9876543210',
        address: '100 Sunset Blvd',
        city: 'Mumbai',
        createdAt: new Date().toISOString(),
      };

      await saveRegisteredUser(testUser);

      // Select and save new profile picture
      const pickedAvatarUri = 'file:///device/photos/elena_avatar_crop_square.jpg';
      const updatedUser: User = {
        ...testUser,
        avatarUri: pickedAvatarUri,
        updatedAt: new Date().toISOString(),
      };

      await updateUserProfileInRegistry(updatedUser);

      const session: AuthSession = {
        user: updatedUser,
        token: 'token_123',
        loginTime: new Date().toISOString(),
      };
      await saveAuthSession(session);

      // Verify persistence in registry
      const registered = await getRegisteredUsers();
      const elena = registered.find((u) => u.id === 'user_profile_1');
      expect(elena).toBeDefined();
      expect(elena?.avatarUri).toBe(pickedAvatarUri);

      // Verify persistence in session
      const restoredSession = await getAuthSession();
      expect(restoredSession?.user.avatarUri).toBe(pickedAvatarUri);
    });

    it('allows removing an existing profile picture and resets to undefined', async () => {
      const testUserWithPhoto: User = {
        id: 'user_remove_photo',
        fullName: 'Marcus Vance',
        email: 'marcus@fotoowl.ai',
        gender: 'Male',
        mobileNumber: '9123456789',
        address: '42 Wallaby Way',
        city: 'Sydney',
        avatarUri: 'file:///device/photos/marcus.jpg',
        createdAt: new Date().toISOString(),
      };

      await saveRegisteredUser(testUserWithPhoto);

      // Remove photo
      const userWithoutPhoto: User = {
        ...testUserWithPhoto,
        avatarUri: undefined,
        updatedAt: new Date().toISOString(),
      };

      await updateUserProfileInRegistry(userWithoutPhoto);

      const registered = await getRegisteredUsers();
      const marcus = registered.find((u) => u.id === 'user_remove_photo');
      expect(marcus?.avatarUri).toBeUndefined();
    });

    it('ensures complete user isolation — User A photo never leaks to User B', async () => {
      const userA: User = {
        id: 'user_a',
        fullName: 'Alice Walker',
        email: 'alice@fotoowl.ai',
        gender: 'Female',
        mobileNumber: '9000000001',
        address: 'Address A',
        city: 'Delhi',
        avatarUri: 'file:///photos/alice_private_avatar.png',
        createdAt: new Date().toISOString(),
      };

      const userB: User = {
        id: 'user_b',
        fullName: 'Bob Builder',
        email: 'bob@fotoowl.ai',
        gender: 'Male',
        mobileNumber: '9000000002',
        address: 'Address B',
        city: 'Bangalore',
        avatarUri: undefined, // Bob has no profile photo
        createdAt: new Date().toISOString(),
      };

      await saveRegisteredUser(userA);
      await saveRegisteredUser(userB);

      const registered = await getRegisteredUsers();
      const alice = registered.find((u) => u.id === 'user_a');
      const bob = registered.find((u) => u.id === 'user_b');

      expect(alice?.avatarUri).toBe('file:///photos/alice_private_avatar.png');
      expect(bob?.avatarUri).toBeUndefined();
    });
  });

  describe('Instant Gallery Launch & Concurrency Protection', () => {
    it('launches native image library with 1:1 aspect ratio, compression quality 0.8, and single selection', async () => {
      (ImagePicker.launchImageLibraryAsync as any).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///selected_avatar.jpg',
            width: 800,
            height: 800,
            fileSize: 1024000,
            mimeType: 'image/jpeg',
          },
        ],
      });

      const result = await pickProfilePhotoFromGallery();
      expect(result.canceled).toBe(false);
      expect(result.uri).toBe('file:///selected_avatar.jpg');
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          selectionLimit: 1,
        })
      );
    });

    it('handles user cancellation gracefully without error and preserves state', async () => {
      (ImagePicker.launchImageLibraryAsync as any).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const result = await pickProfilePhotoFromGallery();
      expect(result.canceled).toBe(true);
      expect(result.uri).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('prevents duplicate picker launches when user multi-taps rapidly', async () => {
      // Mock with asynchronous delay
      (ImagePicker.launchImageLibraryAsync as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  canceled: false,
                  assets: [{ uri: 'file:///first_tap.jpg' }],
                }),
              50
            )
          )
      );

      const [firstCall, secondCall] = await Promise.all([
        pickProfilePhotoFromGallery(),
        pickProfilePhotoFromGallery(),
      ]);

      // First call succeeds, second call is blocked by concurrency lock
      expect(firstCall.canceled).toBe(false);
      expect(secondCall.canceled).toBe(true);
    });
  });

  describe('Background Photo Upload & Retry Logic', () => {
    it('uploads photo asynchronously in background and returns success', async () => {
      const result = await uploadProfilePhotoToServer('user_123', 'file:///avatar.jpg');
      expect(result.success).toBe(true);
      expect(result.photoUri).toBe('file:///avatar.jpg');
    });

    it('handles simulated network timeout and returns actionable retry message', async () => {
      const result = await uploadProfilePhotoToServer('user_123', 'file:///avatar.jpg', {
        shouldSimulateFailure: true,
      });
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Network connection timeout');
    });

    it('returns error when localImageUri is empty', async () => {
      const result = await uploadProfilePhotoToServer('user_123', '');
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Invalid image URI');
    });
  });
});
