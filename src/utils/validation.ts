import { RegistrationFormData, ProfileUpdateData } from '../types/user';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidMobileNumber = (mobile: string): boolean => {
  // Accept only numeric input and require exactly 10 digits
  const cleaned = mobile.trim();
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(cleaned);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export interface FormErrors {
  [key: string]: string | undefined;
}

export const validateRegistrationForm = (data: RegistrationFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name is required (at least 2 characters).';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.gender) {
    errors.gender = 'Please select your gender.';
  }

  if (!data.mobileNumber || !data.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required.';
  } else if (!isValidMobileNumber(data.mobileNumber)) {
    errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
  }

  if (!data.address || data.address.trim().length < 3) {
    errors.address = 'Address is required (at least 3 characters).';
  }

  if (!data.city || !data.city.trim()) {
    errors.city = 'Please select a city.';
  }

  if (!data.password) {
    errors.password = 'Password is required.';
  } else if (!isValidPassword(data.password)) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const validateProfileUpdateForm = (data: ProfileUpdateData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!data.mobileNumber || !data.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required.';
  } else if (!isValidMobileNumber(data.mobileNumber)) {
    errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
  }

  if (!data.gender) {
    errors.gender = 'Please select a gender.';
  }

  if (!data.address || data.address.trim().length < 3) {
    errors.address = 'Address must be at least 3 characters.';
  }

  if (!data.city || !data.city.trim()) {
    errors.city = 'Please select a city.';
  }

  return errors;
};
