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
} from '../storage/asyncStorage';

export interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegistrationFormData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; message?: string }>;
  seedDemoAccount: () => Promise<void>;
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
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

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

      // Safe user object (omit password from in-memory session if desired, keep data clean)
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
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const registeredUsers = await getRegisteredUsers();

      // Check for duplicate email
      const isDuplicate = registeredUsers.some(
        (u) => u.email.toLowerCase() === cleanEmail
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
        createdAt: new Date().toISOString(),
      };

      // Save user to local registry
      await saveRegisteredUser(newUser);

      // Auto-login registered user into active session
      const userSessionData = { ...newUser };
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
      console.error('[AuthContext] Registration error:', error);
      return {
        success: false,
        message: error?.message || 'Registration failed. Please try again.',
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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        seedDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
