import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios || obj.default,
  },
}));

import {
  getApiBaseUrl,
  registerUserApi,
  verifyEmailOtpApi,
  resendOtpApi,
  loginUserApi,
} from '../src/services/authApi';

describe('Auth API Client', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('getApiBaseUrl', () => {
    it('returns a valid HTTP URL pointing to port 8000 in dev', () => {
      const url = getApiBaseUrl();
      expect(url).toMatch(/^http:\/\/.+:8000$/);
    });

    it('honors EXPO_PUBLIC_API_URL override when set', () => {
      const originalEnv = process.env.EXPO_PUBLIC_API_URL;
      process.env.EXPO_PUBLIC_API_URL = 'https://custom-backend.onrender.com';
      expect(getApiBaseUrl()).toBe('https://custom-backend.onrender.com');
      process.env.EXPO_PUBLIC_API_URL = originalEnv;
    });
  });

  describe('registerUserApi', () => {
    it('handles successful API response', async () => {
      const mockResponse = {
        message: 'Registration successful! Verification code sent to your email.',
        email: 'test@fotoowl.ai',
        requires_verification: true,
      };

      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse),
        } as any)
      );

      const result = await registerUserApi({
        fullName: 'Test User',
        email: 'test@fotoowl.ai',
        gender: 'Male',
        mobileNumber: '9876543210',
        address: '123 Test St',
        city: 'Bangalore',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe('test@fotoowl.ai');
      expect(result.is_verified).toBe(false);
    });

    it('throws error when API returns non-200 status', async () => {
      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ detail: 'An account with this email already exists.' }),
        } as any)
      );

      await expect(
        registerUserApi({
          fullName: 'Test User',
          email: 'exists@fotoowl.ai',
          gender: 'Male',
          mobileNumber: '9876543210',
          address: '123 Test St',
          city: 'Bangalore',
          password: 'password123',
          confirmPassword: 'password123',
        })
      ).rejects.toThrow('An account with this email already exists.');
    });
  });

  describe('verifyEmailOtpApi', () => {
    it('handles successful OTP verification', async () => {
      const mockResponse = {
        message: 'Email verified successfully!',
        access_token: 'fake-jwt-token',
        token_type: 'bearer',
        user: {
          id: 'u-1',
          full_name: 'Test User',
          email: 'test@fotoowl.ai',
          is_verified: true,
        },
      };

      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as any)
      );

      const result = await verifyEmailOtpApi('test@fotoowl.ai', '123456');
      expect(result.success).toBe(true);
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user?.isVerified).toBe(true);
    });

    it('throws on invalid or expired OTP error', async () => {
      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ detail: 'Invalid verification code. 4 attempt(s) remaining.' }),
        } as any)
      );

      await expect(verifyEmailOtpApi('test@fotoowl.ai', '000000')).rejects.toThrow(
        'Invalid verification code. 4 attempt(s) remaining.'
      );
    });
  });

  describe('resendOtpApi', () => {
    it('throws on cooldown error', async () => {
      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ detail: 'Please wait 45 seconds before requesting a new code.' }),
        } as any)
      );

      await expect(resendOtpApi('test@fotoowl.ai')).rejects.toThrow(
        'Please wait 45 seconds before requesting a new code.'
      );
    });
  });

  describe('loginUserApi', () => {
    it('detects unverified account and flags is_verified as false', async () => {
      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({
              detail: 'EMAIL_NOT_VERIFIED',
              require_verification: true,
            }),
        } as any)
      );

      const result = await loginUserApi('unverified@fotoowl.ai', 'password123');
      expect(result.success).toBe(false);
      expect(result.is_verified).toBe(false);
      expect(result.errorType).toBe('EMAIL_NOT_VERIFIED');
    });

    it('returns token and user on successful login', async () => {
      (globalThis as any).fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              access_token: 'login-jwt-token',
              token_type: 'bearer',
              user: {
                id: 'u-123',
                full_name: 'Logged In User',
                email: 'user@fotoowl.ai',
                is_verified: true,
              },
            }),
        } as any)
      );

      const result = await loginUserApi('user@fotoowl.ai', 'password123');
      expect(result.success).toBe(true);
      expect(result.token).toBe('login-jwt-token');
      expect(result.user?.fullName).toBe('Logged In User');
    });
  });
});
