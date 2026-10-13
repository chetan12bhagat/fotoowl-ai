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
  saveNotificationsEnabled,
  getSavedNotificationsEnabled,
  saveLanguage,
  getSavedLanguage,
  saveRegisteredUser,
  getRegisteredUsers,
  deleteRegisteredUserFromRegistry,
} from '../src/storage/asyncStorage';
import { User } from '../src/types/user';

describe('Settings Preferences & Account Deletion Persistence', () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('persists and retrieves push notification preferences accurately', async () => {
    // Default should be true
    const initial = await getSavedNotificationsEnabled();
    expect(initial).toBe(true);

    // Toggle off
    await saveNotificationsEnabled(false);
    const toggledOff = await getSavedNotificationsEnabled();
    expect(toggledOff).toBe(false);

    // Toggle back on
    await saveNotificationsEnabled(true);
    const toggledOn = await getSavedNotificationsEnabled();
    expect(toggledOn).toBe(true);
  });

  it('persists and retrieves language preferences accurately', async () => {
    // Default language is English (US)
    const initial = await getSavedLanguage();
    expect(initial).toBe('English (US)');

    // Save Spanish
    await saveLanguage('Español');
    const spanish = await getSavedLanguage();
    expect(spanish).toBe('Español');

    // Save French
    await saveLanguage('Français');
    const french = await getSavedLanguage();
    expect(french).toBe('Français');
  });

  it('permanently and securely deletes a user account from registry on request', async () => {
    const userA: User = {
      id: 'user_delete_1',
      fullName: 'David Test',
      email: 'david@test.com',
      gender: 'Male',
      mobileNumber: '9988776655',
      address: 'Street 1',
      city: 'Pune',
      createdAt: new Date().toISOString(),
    };

    const userB: User = {
      id: 'user_delete_2',
      fullName: 'Emma Test',
      email: 'emma@test.com',
      gender: 'Female',
      mobileNumber: '8877665544',
      address: 'Street 2',
      city: 'Mumbai',
      createdAt: new Date().toISOString(),
    };

    await saveRegisteredUser(userA);
    await saveRegisteredUser(userB);

    const initialUsers = await getRegisteredUsers();
    expect(initialUsers).toHaveLength(2);

    // Delete userA
    await deleteRegisteredUserFromRegistry(userA.id);

    const remainingUsers = await getRegisteredUsers();
    expect(remainingUsers).toHaveLength(1);
    expect(remainingUsers[0].id).toBe(userB.id);
    expect(remainingUsers.some((u) => u.id === userA.id)).toBe(false);
  });
});
