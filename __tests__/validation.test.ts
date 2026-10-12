import { describe, it, expect } from '@jest/globals';
import {
  isValidEmail,
  isValidMobileNumber,
  isValidPassword,
  validateRegistrationForm,
  validateProfileUpdateForm,
} from '../src/utils/validation';
import { RegistrationFormData, ProfileUpdateData } from '../src/types/user';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmail('user@fotoowl.ai')).toBe(true);
      expect(isValidEmail('test.intern@domain.co.in')).toBe(true);
      expect(isValidEmail('alex+events@gmail.com')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@tld')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidMobileNumber', () => {
    it('accepts strictly 10 digit numeric phone numbers', () => {
      expect(isValidMobileNumber('9876543210')).toBe(true);
      expect(isValidMobileNumber('1234567890')).toBe(true);
    });

    it('rejects numbers with non-digit characters or incorrect length', () => {
      expect(isValidMobileNumber('987654321')).toBe(false); // 9 digits
      expect(isValidMobileNumber('98765432100')).toBe(false); // 11 digits
      expect(isValidMobileNumber('98765-43210')).toBe(false);
      expect(isValidMobileNumber('abcdefghij')).toBe(false);
      expect(isValidMobileNumber('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('accepts passwords with 6 or more characters', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('securePassword!')).toBe(true);
    });

    it('rejects passwords under 6 characters', () => {
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('validateRegistrationForm', () => {
    const validData: RegistrationFormData = {
      fullName: 'Rohan Verma',
      email: 'rohan@example.com',
      gender: 'Male',
      mobileNumber: '9876543210',
      address: '42 MG Road, Indiranagar',
      city: 'Bangalore',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('returns empty error map for valid form input', () => {
      const errors = validateRegistrationForm(validData);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('flags mismatched passwords', () => {
      const errors = validateRegistrationForm({
        ...validData,
        confirmPassword: 'differentPassword',
      });
      expect(errors.confirmPassword).toBe('Passwords do not match.');
    });

    it('flags invalid mobile numbers', () => {
      const errors = validateRegistrationForm({
        ...validData,
        mobileNumber: '12345',
      });
      expect(errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('flags missing required fields', () => {
      const emptyData: RegistrationFormData = {
        fullName: '',
        email: '',
        gender: 'Male',
        mobileNumber: '',
        address: '',
        city: '',
        password: '',
        confirmPassword: '',
      };
      const errors = validateRegistrationForm(emptyData);
      expect(errors.fullName).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.mobileNumber).toBeDefined();
      expect(errors.address).toBeDefined();
      expect(errors.city).toBeDefined();
      expect(errors.password).toBeDefined();
    });
  });

  describe('validateProfileUpdateForm', () => {
    it('validates profile updates properly', () => {
      const validProfile: ProfileUpdateData = {
        fullName: 'Aarav Patel',
        mobileNumber: '9123456780',
        gender: 'Male',
        address: 'HSR Layout Sector 1',
        city: 'Bangalore',
      };
      expect(Object.keys(validateProfileUpdateForm(validProfile)).length).toBe(0);

      const invalidProfile: ProfileUpdateData = {
        fullName: 'A',
        mobileNumber: '999',
        gender: 'Male',
        address: '',
        city: '',
      };
      const errors = validateProfileUpdateForm(invalidProfile);
      expect(errors.fullName).toBeDefined();
      expect(errors.mobileNumber).toBeDefined();
      expect(errors.address).toBeDefined();
      expect(errors.city).toBeDefined();
    });
  });
});
