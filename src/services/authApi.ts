import { Platform } from 'react-native';
import { RegistrationFormData, User } from '../types/user';

// Production public HTTPS backend URL (deployed Render cloud service)
// Automatically used for standalone release builds on Android and iOS
export const DEFAULT_PRODUCTION_API_URL = 'https://fotoowl-backend.onrender.com';

// Local Mac network IP for active development and device testing on local Wi-Fi
export const LOCAL_DEV_API_URL = 'http://192.168.1.4:8000';

/**
 * Resolves the backend API URL:
 * 1. Explicit EXPO_PUBLIC_API_URL from environment / EAS secrets (highest precedence)
 * 2. In production builds (!__DEV__), uses the persistent public cloud HTTPS URL
 * 3. In local development (__DEV__), uses the local Mac IP address
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // Standalone release builds for app stores (Android APK / iOS IPA)
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  if (!isDev) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  // Development mode fallback
  return LOCAL_DEV_API_URL;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errorType?: string;
  status?: number;
}

export interface RegisterApiResponse {
  success: boolean;
  message: string;
  email: string;
  is_verified: boolean;
}

export interface VerifyOtpApiResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface ResendOtpApiResponse {
  success: boolean;
  message: string;
  cooldown_seconds: number;
}

export interface LoginApiResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  is_verified?: boolean;
  errorType?: string;
}

/**
 * Helper to make HTTP requests with timeout to the Python FastAPI backend
 */
async function fetchWithTimeout(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please verify your backend server is running.');
    }
    throw error;
  }
}

/**
 * Register a new user with FastAPI backend
 * Creates a pending unverified account and triggers OTP email dispatch
 */
export async function registerUserApi(
  data: RegistrationFormData
): Promise<RegisterApiResponse> {
  try {
    const response = await fetchWithTimeout('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password.trim(),
        gender: data.gender,
        mobileNumber: data.mobileNumber.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = body?.detail || body?.message || 'Registration failed.';
      throw new Error(errorMsg);
    }

    return {
      success: true,
      message: body.message || 'Verification code sent to your email.',
      email: body.email || data.email,
      is_verified: false,
    };
  } catch (error: any) {
    console.warn('[authApi] registerUserApi error:', error.message);
    throw error;
  }
}

/**
 * Verify 6-digit OTP code with FastAPI backend
 */
export async function verifyEmailOtpApi(
  email: string,
  otp: string
): Promise<VerifyOtpApiResponse> {
  try {
    const response = await fetchWithTimeout('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = body?.detail || body?.message || 'Verification failed.';
      throw new Error(errorMsg);
    }

    const mappedUser: User | undefined = body.user
      ? {
          id: String(body.user.id),
          fullName: body.user.full_name || body.user.fullName || '',
          email: body.user.email,
          gender: body.user.gender || 'Other',
          mobileNumber: body.user.mobile_number || body.user.mobileNumber || '',
          address: body.user.address || '',
          city: body.user.city || '',
          isVerified: body.user.is_verified ?? true,
          createdAt: body.user.created_at || new Date().toISOString(),
        }
      : undefined;

    return {
      success: true,
      message: body.message || 'Email verified successfully!',
      token: body.access_token || body.token,
      user: mappedUser,
    };
  } catch (error: any) {
    console.warn('[authApi] verifyEmailOtpApi error:', error.message);
    throw error;
  }
}

/**
 * Request a fresh 6-digit OTP code with cooldown enforcement
 */
export async function resendOtpApi(
  email: string
): Promise<ResendOtpApiResponse> {
  try {
    const response = await fetchWithTimeout('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = body?.detail || body?.message || 'Failed to resend code.';
      throw new Error(errorMsg);
    }

    return {
      success: true,
      message: body.message || 'A new code has been sent to your email.',
      cooldown_seconds: body.cooldown_seconds || 60,
    };
  } catch (error: any) {
    console.warn('[authApi] resendOtpApi error:', error.message);
    throw error;
  }
}

/**
 * Login with FastAPI backend
 * If account is unverified, returns errorType: "EMAIL_NOT_VERIFIED"
 */
export async function loginUserApi(
  email: string,
  password: string
): Promise<LoginApiResponse> {
  try {
    const response = await fetchWithTimeout('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (
      response.status === 403 &&
      (body?.detail === 'EMAIL_NOT_VERIFIED' || body?.require_verification)
    ) {
      return {
        success: false,
        is_verified: false,
        errorType: 'EMAIL_NOT_VERIFIED',
        message:
          'Your email address is not verified yet. We have sent a new 6-digit code to your inbox.',
      };
    }

    if (!response.ok) {
      const errorMsg = body?.detail || body?.message || 'Invalid email or password.';
      return {
        success: false,
        message: errorMsg,
      };
    }

    const mappedUser: User | undefined = body.user
      ? {
          id: String(body.user.id),
          fullName: body.user.full_name || body.user.fullName || '',
          email: body.user.email,
          gender: body.user.gender || 'Other',
          mobileNumber: body.user.mobile_number || body.user.mobileNumber || '',
          address: body.user.address || '',
          city: body.user.city || '',
          isVerified: body.user.is_verified ?? true,
          createdAt: body.user.created_at || new Date().toISOString(),
        }
      : undefined;

    return {
      success: true,
      message: 'Login successful',
      token: body.access_token || body.token,
      user: mappedUser,
      is_verified: true,
    };
  } catch (error: any) {
    console.warn('[authApi] loginUserApi error:', error.message);
    return {
      success: false,
      message: error?.message || 'Network error connecting to backend.',
    };
  }
}

/**
 * Fetch authenticated user profile using JWT token
 */
export async function getCurrentUserApi(token: string): Promise<User | null> {
  try {
    const response = await fetchWithTimeout('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
