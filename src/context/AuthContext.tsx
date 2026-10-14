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
  savePendingOtp,
  getPendingOtp,
  clearPendingOtp,
} from '../storage/asyncStorage';

export interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string; otp?: string }>;
  register: (
    data: RegistrationFormData
  ) => Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string; otp?: string }>;
  verifyEmail: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; message?: string }>;
  resendOtp: (
    email: string
  ) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number; otp?: string }>;
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
  ): Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string; otp?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // Check built-in demo account
      if (cleanEmail === 'demo@fotoowl.ai' && cleanPassword === 'password123') {
        const demoUser: User = {
          id: 'demo_user_fotoowl',
          fullName: 'Alex Morgan',
          email: 'demo@fotoowl.ai',
          gender: 'Male',
          mobileNumber: '9876543210',
          address: '742 Evergreen Terrace, Koramangala',
          city: 'Bangalore',
          isVerified: true,
          avatarId: 'owl_avatar_1',
          createdAt: new Date().toISOString(),
        };

        const newSession: AuthSession = {
          user: demoUser,
          token: `fotoowl_tok_${Date.now()}_demo`,
          loginTime: new Date().toISOString(),
        };

        await saveAuthSession(newSession);
        setSession(newSession);
        setUser(demoUser);
        return { success: true };
      }

      // Check registered users in AsyncStorage
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

      // Check if user requires OTP email verification
      if (existingUser.isVerified === false) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await savePendingOtp(cleanEmail, generatedOtp);

        return {
          success: false,
          requireVerification: true,
          email: cleanEmail,
          otp: generatedOtp,
          message: 'Please verify your email address to continue.',
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
  ): Promise<{ success: boolean; message?: string; requireVerification?: boolean; email?: string; otp?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();

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

      // Generate a 6-digit OTP code for frontend verification
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await savePendingOtp(cleanEmail, generatedOtp);

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
        otp: generatedOtp,
        message: 'Account created. Enter your 6-digit code to complete verification.',
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
    const cleanOtp = otp.trim();

    try {
      const storedOtp = await getPendingOtp(cleanEmail);

      // Validate: allow either the generated OTP or master fallback '123456'
      const isValid = cleanOtp === storedOtp || cleanOtp === '123456';

      if (!isValid) {
        return {
          success: false,
          message: 'Incorrect verification code. Please check and try again.',
        };
      }

      // Mark user as verified in AsyncStorage registry
      const registered = await getRegisteredUsers();
      const existing = registered.find((u) => u.email.toLowerCase() === cleanEmail);

      const verifiedUser: User = existing
        ? {
            ...existing,
            isVerified: true,
          }
        : {
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

      delete verifiedUser.password;

      await updateUserProfileInRegistry(verifiedUser);
      await clearPendingOtp(cleanEmail);

      const newSession: AuthSession = {
        user: verifiedUser,
        token: `fotoowl_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        loginTime: new Date().toISOString(),
      };

      await saveAuthSession(newSession);
      setSession(newSession);
      setUser(verifiedUser);

      return { success: true, message: 'Email verified successfully!' };
    } catch (error: any) {
      console.error('[AuthContext] Verification error:', error);
      return { success: false, message: error?.message || 'Verification failed.' };
    }
  };

  const resendOtp = async (
    email: string
  ): Promise<{ success: boolean; message?: string; cooldownSeconds?: number; otp?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await savePendingOtp(cleanEmail, newOtp);

      return {
        success: true,
        message: 'A new verification code has been generated.',
        cooldownSeconds: 30,
        otp: newOtp,
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
      isVerified: true,
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
