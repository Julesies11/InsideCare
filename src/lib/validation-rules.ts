/**
 * Validation Rules Library
 * Common validation functions that can be reused across forms
 */

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export const validators = {
  /**
   * Validates that a value is not empty
   */
  required: (value: any, fieldName: string): ValidationResult => {
    const isValid = value !== null && value !== undefined && String(value).trim() !== '';
    return {
      isValid,
      error: isValid ? '' : `${fieldName} is required`,
    };
  },

  /**
   * Validates email format
   */
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = !value || emailRegex.test(value);
    return {
      isValid,
      error: isValid ? '' : 'Please enter a valid email address',
    };
  },

  /**
   * Validates that a value is required only when a condition is met
   */
  requiredWhen: (value: any, condition: boolean, fieldName: string): ValidationResult => {
    if (!condition) {
      return { isValid: true, error: '' };
    }
    return validators.required(value, fieldName);
  },

  /**
   * Validates minimum length
   */
  minLength: (value: string, min: number, fieldName: string): ValidationResult => {
    const isValid = !value || value.length >= min;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be at least ${min} characters`,
    };
  },

  /**
   * Validates maximum length
   */
  maxLength: (value: string, max: number, fieldName: string): ValidationResult => {
    const isValid = !value || value.length <= max;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be no more than ${max} characters`,
    };
  },

  /**
   * Validates phone number format (basic)
   */
  phone: (value: string): ValidationResult => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const isValid = !value || phoneRegex.test(value);
    return {
      isValid,
      error: isValid ? '' : 'Please enter a valid phone number',
    };
  },

  /**
   * Validates URL format
   */
  url: (value: string): ValidationResult => {
    try {
      if (!value) return { isValid: true, error: '' };
      new URL(value);
      return { isValid: true, error: '' };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }
  },

  /**
   * Validates that a value matches another value (e.g., password confirmation)
   */
  matches: (value: string, matchValue: string, fieldName: string): ValidationResult => {
    const isValid = value === matchValue;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} does not match`,
    };
  },

  /**
   * Validates numeric value
   */
  numeric: (value: any, fieldName: string): ValidationResult => {
    const isValid = !value || !isNaN(Number(value));
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be a number`,
    };
  },

  /**
   * Validates minimum numeric value
   */
  min: (value: number, min: number, fieldName: string): ValidationResult => {
    const isValid = value === null || value === undefined || value >= min;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be at least ${min}`,
    };
  },

  /**
   * Validates maximum numeric value
   */
  max: (value: number, max: number, fieldName: string): ValidationResult => {
    const isValid = value === null || value === undefined || value <= max;
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be no more than ${max}`,
    };
  },

  /**
   * Validates date is in the past
   */
  pastDate: (value: string, fieldName: string): ValidationResult => {
    if (!value) return { isValid: true, error: '' };
    const date = new Date(value);
    const isValid = date < new Date();
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be in the past`,
    };
  },

  /**
   * Validates date is in the future
   */
  futureDate: (value: string, fieldName: string): ValidationResult => {
    if (!value) return { isValid: true, error: '' };
    const date = new Date(value);
    const isValid = date > new Date();
    return {
      isValid,
      error: isValid ? '' : `${fieldName} must be in the future`,
    };
  },
};

/**
 * Helper function to run multiple validators and return the first error
 */
export function validateField(
  value: any,
  validatorFns: Array<() => ValidationResult>
): ValidationResult {
  for (const validator of validatorFns) {
    const result = validator();
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true, error: '' };
}
