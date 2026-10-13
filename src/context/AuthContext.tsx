import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  AuthSession,
  RegistrationFormData,
  ProfileUpdateData,
} from '../types/user';
import {
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  getRegisteredUsers,
  saveRegisteredUser,
  updateUserProfileInRegistry,
  deleteRegisteredUserFromRegistry,
} from '../storage/asyncStorage';
import {
  registerUserApi,
  verifyEmailOtpApi,
  resendOtpApi,
  loginUserApi,
} from '../services/authApi';

export interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string }>;
  register: (
    data: RegistrationFormData
  ) => Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string }>;
  verifyEmail: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; message?: string }>;
  resendOtp: (
    email: string
  ) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number }>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; message?: string }>;
  updateAvatar: (avatarUri: string | null) => Promise<{ success: boolean; message?: string }>;
  seedDemoAccount: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from AsyncStorage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = await getAuthSession();
        if (storedSession && storedSession.user) {
          setSession(storedSession);
          setUser(storedSession.user);
        }
      } catch (error) {
        console.error('[AuthContext] Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. Attempt FastAPI backend authentication first
      const apiResult = await loginUserApi(cleanEmail, cleanPassword);

      if (apiResult.errorType === 'EMAIL_NOT_VERIFIED') {
        return {
          success: false,
          requireVerification: true,
          email: cleanEmail,
          message: apiResult.message || 'Please verify your email address to continue.',
        };
      }

      if (apiResult.success && apiResult.token && apiResult.user) {
        const userSessionData: User = {
          ...apiResult.user,
          gender: (apiResult.user.gender as any) || 'Male',
        };

        const newSession: AuthSession = {
          user: userSessionData,
          token: apiResult.token,
          loginTime: new Date().toISOString(),
        };

        await saveAuthSession(newSession);
        setSession(newSession);
        setUser(userSessionData);
        return { success: true };
      }

      // If backend returned explicit credential error
      if (apiResult.message && !apiResult.message.includes('Network error')) {
        return {
          success: false,
          message: apiResult.message,
        };
      }
    } catch {
      // Network failure, check local storage fallback below
    }

    // 2. Offline / Local fallback
    try {
      const registeredUsers = await getRegisteredUsers();
      const existingUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (!existingUser) {
        return {
          success: false,
          message: 'No account found with this email. Please register first.',
        };
      }

      if (existingUser.password !== cleanPassword) {
        return {
          success: false,
          message: 'Incorrect password. Please verify and try again.',
        };
      }

      if (existingUser.isVerified === false) {
        return {
          success: false,
          requireVerification: true,
          email: cleanEmail,
          message: 'Please verify your email address before logging in.',
        };
      }

      const userSessionData: User = { ...existingUser };
      delete userSessionData.password;

      const newSession: AuthSession = {
        user: userSessionData,
        token: `fotoowl_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        loginTime: new Date().toISOString(),
      };

      await saveAuthSession(newSession);
      setSession(newSession);
      setUser(userSessionData);

      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      return {
        success: false,
        message: error?.message || 'Login failed due to a system error.',
      };
    }
  };

  const register = async (
    data: RegistrationFormData
  ): Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();

    try {
      // 1. Submit to FastAPI backend
      const apiResult = await registerUserApi(data);

      if (apiResult.success) {
        // Cache user locally as unverified
        const pendingUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fullName: data.fullName.trim(),
          email: cleanEmail,
          gender: data.gender,
          mobileNumber: data.mobileNumber.trim(),
          address: data.address.trim(),
          city: data.city.trim(),
          password: data.password.trim(),
          avatarId: 'owl_avatar_1',
          isVerified: false,
          createdAt: new Date().toISOString(),
        };
        await saveRegisteredUser(pendingUser);

        return {
          success: true,
          requireVerification: true,
          email: cleanEmail,
          message: apiResult.message,
        };
      }
    } catch (apiError: any) {
      // If error is duplicate email from backend
      if (apiError.message && (apiError.message.includes('already exists') || apiError.message.includes('registered'))) {
        return {
          success: false,
          message: apiError.message,
        };
      }

      console.warn('[AuthContext] FastAPI register error, falling back locally:', apiError.message);
    }

    // 2. Offline / Local fallback if backend is unreachable
    try {
      const registeredUsers = await getRegisteredUsers();
      const isDuplicate = registeredUsers.some(
        (u) => u.email.toLowerCase() === cleanEmail && u.isVerified !== false
      );

      if (isDuplicate) {
        return {
          success: false,
          message: 'An account with this email address already exists. Please log in instead.',
        };
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: data.fullName.trim(),
        email: cleanEmail,
        gender: data.gender,
        mobileNumber: data.mobileNumber.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        password: data.password.trim(),
        avatarId: 'owl_avatar_1',
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      await saveRegisteredUser(newUser);

      return {
        success: true,
        requireVerification: true,
        email: cleanEmail,
        message: 'Registration submitted. Please verify the code sent to your email.',
      };
    } catch (error: any) {
      console.error('[AuthContext] Registration error:', error);
      return {
        success: false,
        message: error?.message || 'Registration failed. Please try again.',
      };
    }
  };

  const verifyEmail = async (
    email: string,
    otp: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Verify with FastAPI backend
      const apiResult = await verifyEmailOtpApi(cleanEmail, otp);

      if (apiResult.success && apiResult.token) {
        const verifiedUser: User = apiResult.user || {
          id: `user_${Date.now()}`,
          fullName: 'FotoOwl Member',
          email: cleanEmail,
          gender: 'Male',
          mobileNumber: '',
          address: '',
          city: 'Bangalore',
          isVerified: true,
          createdAt: new Date().toISOString(),
        };

        const newSession: AuthSession = {
          user: verifiedUser,
          token: apiResult.token,
          loginTime: new Date().toISOString(),
        };

        await saveAuthSession(newSession);
        setSession(newSession);
        setUser(verifiedUser);

        // Update local registry
        const registered = await getRegisteredUsers();
        const existing = registered.find((u) => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          await updateUserProfileInRegistry({ ...existing, isVerified: true });
        }

        return { success: true, message: apiResult.message };
      }
    } catch (apiError: any) {
      // If backend returned explicit error message (e.g. incorrect or expired)
      if (apiError.message && !apiError.message.includes('timed out') && !apiError.message.includes('Network')) {
        return { success: false, message: apiError.message };
      }
      console.warn('[AuthContext] verifyEmail error, checking fallback:', apiError.message);
    }

    // 2. Offline / Local fallback for testing
    try {
      const registered = await getRegisteredUsers();
      const existing = registered.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        const verifiedUser: User = {
          ...existing,
          isVerified: true,
        };
        await updateUserProfileInRegistry(verifiedUser);

        const newSession: AuthSession = {
          user: verifiedUser,
          token: `fotoowl_tok_${Date.now()}`,
          loginTime: new Date().toISOString(),
        };
        await saveAuthSession(newSession);
        setSession(newSession);
        setUser(verifiedUser);
        return { success: true };
      }

      return { success: false, message: 'No pending account found for this email.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Verification failed.' };
    }
  };

  const resendOtp = async (
    email: string
  ): Promise<{ success: boolean; message?: string; cooldownSeconds?: number }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await resendOtpApi(cleanEmail);
      return {
        success: true,
        message: res.message,
        cooldownSeconds: res.cooldown_seconds,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Could not resend verification code.',
      };
    }
  };

  const updateProfile = async (
    updateData: ProfileUpdateData
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'No active user session to update.' };
      }

      const updatedUser: User = {
        ...user,
        fullName: updateData.fullName.trim(),
        mobileNumber: updateData.mobileNumber.trim(),
        gender: updateData.gender,
        address: updateData.address.trim(),
        city: updateData.city.trim(),
        avatarId: updateData.avatarId || user.avatarId,
        avatarUri:
          updateData.avatarUri !== undefined
            ? updateData.avatarUri || undefined
            : user.avatarUri,
        updatedAt: new Date().toISOString(),
      };

      // Update registry and session
      await updateUserProfileInRegistry(updatedUser);

      if (session) {
        const updatedSession: AuthSession = {
          ...session,
          user: updatedUser,
        };
        await saveAuthSession(updatedSession);
        setSession(updatedSession);
      }

      setUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Profile update error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to update profile.',
      };
    }
  };

  const updateAvatar = async (
    avatarUri: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!user) {
        return { success: false, message: 'No active user session to update.' };
      }

      const updatedUser: User = {
        ...user,
        avatarUri: avatarUri ? avatarUri : undefined,
        updatedAt: new Date().toISOString(),
      };

      // Update registry and session
      await updateUserProfileInRegistry(updatedUser);

      if (session) {
        const updatedSession: AuthSession = {
          ...session,
          user: updatedUser,
        };
        await saveAuthSession(updatedSession);
        setSession(updatedSession);
      }

      setUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Avatar update error:', error);
      return {
        success: false,
        message: error?.message || 'Failed to update avatar photo.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await clearAuthSession();
    } catch (error) {
      console.error('[AuthContext] Error during logout clearing:', error);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const seedDemoAccount = async (): Promise<void> => {
    const demoUser: User = {
      id: 'demo_user_fotoowl',
      fullName: 'Alex Morgan',
      email: 'demo@fotoowl.ai',
      gender: 'Male',
      mobileNumber: '9876543210',
      address: '742 Evergreen Terrace, Koramangala',
      city: 'Bangalore',
      password: 'password123',
      avatarId: 'owl_avatar_1',
      createdAt: new Date().toISOString(),
    };
    await saveRegisteredUser(demoUser);
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      if (user?.id) {
        await deleteRegisteredUserFromRegistry(user.id);
      }
      await clearAuthSession();
      setUser(null);
      setSession(null);
      return true;
    } catch (error) {
      console.error('[AuthContext] Error deleting account:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        updateProfile,
        updateAvatar,
        seedDemoAccount,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
