import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

export interface DownloadResult {
  success: boolean;
  message: string;
  localUri?: string;
}

/**
 * Downloads a photo from remote URL and saves it directly to device media library.
 */
export const downloadPhotoToGallery = async (
  imageUrl: string,
  photoId: string
): Promise<DownloadResult> => {
  try {
    if (!imageUrl) {
      return { success: false, message: 'Invalid image URL provided.' };
    }

    // Web fallback
    if (Platform.OS === 'web') {
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `FotoOwl_${photoId}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, message: 'Download initiated in browser.' };
      } catch (err: any) {
        return { success: false, message: 'Browser download failed: ' + err.message };
      }
    }

    // 1. Request Media Library Permissions
    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      return {
        success: false,
        message:
          'Storage permission was denied. Please grant photo library access in your system settings to save photos.',
      };
    }

    // 2. Prepare local cache path
    const fileUri = `${FileSystem.cacheDirectory}fotoowl_photo_${photoId}_${Date.now()}.jpg`;

    // 3. Download the file locally
    const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);

    if (downloadRes.status !== 200) {
      return {
        success: false,
        message: `Failed to download image file (HTTP ${downloadRes.status}).`,
      };
    }

    // 4. Save file to Device Photo Library
    const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);

    // Optional: add to a dedicated "FotoOwl.AI" album if supported
    try {
      const album = await MediaLibrary.getAlbumAsync('FotoOwl.AI');
      if (album === null) {
        await MediaLibrary.createAlbumAsync('FotoOwl.AI', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch {
      // If custom album creation fails on certain Android configurations, asset is still saved in gallery
    }

    return {
      success: true,
      message: 'Photo saved successfully to your gallery!',
      localUri: downloadRes.uri,
    };
  } catch (error: any) {
    console.error('[Media] Download error:', error);
    return {
      success: false,
      message: error?.message || 'An unexpected error occurred while saving photo.',
    };
  }
};

/**
 * Shares photo via native device share sheet
 */
export const sharePhoto = async (
  imageUrl: string,
  authorName: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: `FotoOwl.AI Photo by ${authorName}`,
          url: imageUrl,
        });
        return { success: true };
      } else {
        await navigator.clipboard.writeText(imageUrl);
        return { success: true, message: 'Image link copied to clipboard!' };
      }
    }

    // Download locally to share image file if possible
    const tempUri = `${FileSystem.cacheDirectory}fotoowl_share_${Date.now()}.jpg`;
    const download = await FileSystem.downloadAsync(imageUrl, tempUri);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(download.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Share FotoOwl.AI Photo by ${authorName}`,
        UTI: 'public.jpeg',
      });
      return { success: true };
    } else {
      return { success: false, message: 'Sharing is not available on this device.' };
    }
  } catch (error: any) {
    console.error('[Media] Share error:', error);
    return { success: false, message: error?.message || 'Failed to share image.' };
  }
};
