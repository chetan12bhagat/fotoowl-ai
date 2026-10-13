export type Gender = 'Male' | 'Female' | 'Other';

export interface User {
  id: string;
  fullName: string;
  email: string;
  gender: Gender;
  mobileNumber: string;
  address: string;
  city: string;
  password?: string;
  avatarId?: string;
  avatarUri?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  loginTime: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  gender: Gender;
  mobileNumber: string;
  address: string;
  city: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  fullName: string;
  mobileNumber: string;
  gender: Gender;
  address: string;
  city: string;
  avatarId?: string;
  avatarUri?: string | null;
}
