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

import {
  savePendingOtp,
  getPendingOtp,
  clearPendingOtp,
  saveRegisteredUser,
  getRegisteredUsers,
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  updateUserProfileInRegistry,
} from '../src/storage/asyncStorage';
import { User } from '../src/types/user';

describe('Frontend OTP & Auth Storage Logic', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    await clearAuthSession();
  });

  it('stores, retrieves, and clears pending OTPs correctly', async () => {
    const testEmail = 'pilot@fotoowl.ai';
    const testOtp = '849201';

    await savePendingOtp(testEmail, testOtp);
    const retrieved = await getPendingOtp(testEmail);
    expect(retrieved).toBe(testOtp);

    // Case-insensitivity check
    const retrievedUpper = await getPendingOtp('PILOT@FOTOOWL.AI');
    expect(retrievedUpper).toBe(testOtp);

    await clearPendingOtp(testEmail);
    const afterClear = await getPendingOtp(testEmail);
    expect(afterClear).toBeNull();
  });

  it('registers user, verifies via OTP and logs in successfully', async () => {
    const email = 'user_test@fotoowl.ai';
    const otp = '654321';

    // 1. Pending registration
    const newUser: User = {
      id: 'test_u_1',
      fullName: 'Test User',
      email,
      gender: 'Female',
      mobileNumber: '9876543210',
      address: 'Indiranagar',
      city: 'Bangalore',
      password: 'mypassword',
      isVerified: false,
      avatarId: 'owl_avatar_1',
      createdAt: new Date().toISOString(),
    };

    await saveRegisteredUser(newUser);
    await savePendingOtp(email, otp);

    const usersBefore = await getRegisteredUsers();
    const stored = usersBefore.find((u) => u.email === email);
    expect(stored).toBeDefined();
    expect(stored?.isVerified).toBe(false);

    // 2. Verify OTP
    const pendingCode = await getPendingOtp(email);
    expect(pendingCode).toBe(otp);

    // Mark verified
    await updateUserProfileInRegistry({
      ...stored!,
      isVerified: true,
    });
    await clearPendingOtp(email);

    const usersAfter = await getRegisteredUsers();
    const verifiedUser = usersAfter.find((u) => u.email === email);
    expect(verifiedUser?.isVerified).toBe(true);
    expect(await getPendingOtp(email)).toBeNull();

    // 3. Save session
    await saveAuthSession({
      user: verifiedUser!,
      token: 'jwt_mock_token_123',
      loginTime: new Date().toISOString(),
    });

    const activeSession = await getAuthSession();
    expect(activeSession?.user.email).toBe(email);
    expect(activeSession?.token).toBe('jwt_mock_token_123');
  });
});
