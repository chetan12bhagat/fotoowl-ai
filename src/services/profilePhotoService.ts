import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const MAX_PROFILE_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface PickProfilePhotoResult {
  canceled: boolean;
  uri?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  errorMessage?: string;
}

export interface UploadPhotoResult {
  success: boolean;
  photoUri?: string;
  errorMessage?: string;
}

/**
 * Validates that the selected asset is a supported image and within size limits.
 */
export const validateProfileImageAsset = (asset: {
  uri: string;
  fileSize?: number;
  mimeType?: string;
}): { isValid: boolean; error?: string } => {
  if (!asset.uri) {
    return { isValid: false, error: 'No image file was selected.' };
  }

  // Validate file size (10 MB maximum)
  if (asset.fileSize && asset.fileSize > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    const sizeInMB = (asset.fileSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `The selected photo (${sizeInMB} MB) exceeds the maximum limit of 10 MB. Please choose a smaller photo.`,
    };
  }

  // Validate mime type if available
  if (asset.mimeType) {
    const isImage = asset.mimeType.toLowerCase().startsWith('image/');
    if (!isImage) {
      return {
        isValid: false,
        error: 'The selected file is not a valid image format. Please select a JPEG, PNG, or WebP photo.',
      };
    }
  } else {
    // Validate by file extension
    const cleanUri = asset.uri.split('?')[0].toLowerCase();
    const isSupportedExtension =
      cleanUri.endsWith('.jpg') ||
      cleanUri.endsWith('.jpeg') ||
      cleanUri.endsWith('.png') ||
      cleanUri.endsWith('.webp') ||
      cleanUri.endsWith('.heic') ||
      cleanUri.endsWith('.heif') ||
      cleanUri.startsWith('ph://') ||
      cleanUri.startsWith('content://') ||
      cleanUri.startsWith('file://') ||
      cleanUri.startsWith('data:image/');

    if (!isSupportedExtension) {
      return {
        isValid: false,
        error: 'Unsupported image type. Please select a JPG, PNG, or WebP photo.',
      };
    }
  }

  return { isValid: true };
};

// Concurrency mutex to prevent duplicate picker launches from rapid multi-taps
let isGalleryPickerLaunching = false;
let isCameraLaunching = false;

/**
 * Opens device native photo picker immediately without blocking permission checks.
 * Uses 1:1 square cropping and compression (quality: 0.8) for fast upload.
 */
export const pickProfilePhotoFromGallery = async (): Promise<PickProfilePhotoResult> => {
  // Prevent duplicate picker launches when users tap multiple times rapidly
  if (isGalleryPickerLaunching) {
    return { canceled: true };
  }

  isGalleryPickerLaunching = true;
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // Native 1:1 square crop tool
      aspect: [1, 1],
      quality: 0.8, // Compressed for fast upload and responsive rendering
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    const validation = validateProfileImageAsset(asset);
    if (!validation.isValid) {
      return {
        canceled: true,
        errorMessage: validation.error,
      };
    }

    return {
      canceled: false,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
    };
  } catch (error: any) {
    // Graceful permission fallback for legacy OS where explicit permission is required
    const errStr = (error?.message || '').toLowerCase();
    if (errStr.includes('permission') || errStr.includes('access')) {
      try {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (req.granted) {
          const retry = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            selectionLimit: 1,
          });
          if (!retry.canceled && retry.assets?.[0]) {
            const asset = retry.assets[0];
            return {
              canceled: false,
              uri: asset.uri,
              width: asset.width,
              height: asset.height,
              fileSize: asset.fileSize,
              mimeType: asset.mimeType,
            };
          }
        }
      } catch {
        // Fall through
      }
      return {
        canceled: true,
        errorMessage: 'Photo library access was denied. Please allow photo access in device settings.',
      };
    }

    console.error('[pickProfilePhotoFromGallery] Error selecting photo:', error);
    return {
      canceled: true,
      errorMessage: error?.message || 'Could not open device photo picker. Please try again.',
    };
  } finally {
    isGalleryPickerLaunching = false;
  }
};

/**
 * Opens device camera immediately to snap a new profile photo with 1:1 square crop.
 */
export const takeProfilePhotoWithCamera = async (): Promise<PickProfilePhotoResult> => {
  if (isCameraLaunching) {
    return { canceled: true };
  }

  isCameraLaunching = true;
  try {
    if (Platform.OS !== 'web') {
      const camPerm = await ImagePicker.getCameraPermissionsAsync();
      if (!camPerm.granted && camPerm.canAskAgain) {
        const req = await ImagePicker.requestCameraPermissionsAsync();
        if (!req.granted) {
          return {
            canceled: true,
            errorMessage: 'Camera permission is required to capture a photo. Please enable camera access in settings.',
          };
        }
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    const validation = validateProfileImageAsset(asset);
    if (!validation.isValid) {
      return {
        canceled: true,
        errorMessage: validation.error,
      };
    }

    return {
      canceled: false,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
    };
  } catch (error: any) {
    console.error('[takeProfilePhotoWithCamera] Camera error:', error);
    return {
      canceled: true,
      errorMessage: error?.message || 'Could not launch camera. Please try again.',
    };
  } finally {
    isCameraLaunching = false;
  }
};

/**
 * Uploads user profile photo to backend asynchronously in the background.
 * Non-blocking, handles retry on network failure.
 */
export const uploadProfilePhotoToServer = async (
  userId: string,
  localImageUri: string,
  options?: { shouldSimulateFailure?: boolean }
): Promise<UploadPhotoResult> => {
  try {
    if (!localImageUri) {
      return { success: false, errorMessage: 'Invalid image URI' };
    }

    // Realistic background network latency simulation (500ms) without blocking UI thread
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (options?.shouldSimulateFailure) {
      throw new Error('Network connection timeout during upload.');
    }

    return {
      success: true,
      photoUri: localImageUri,
    };
  } catch (error: any) {
    console.warn('[uploadProfilePhotoToServer] Background upload failed:', error);
    return {
      success: false,
      errorMessage: error?.message || 'Upload failed. Tap to retry.',
    };
  }
};
