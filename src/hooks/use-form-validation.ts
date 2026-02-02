import { useState } from 'react';

export interface UseFormValidationOptions {
  onValidationError?: (field: string, error: string) => void;
}

export interface UseFormValidationReturn {
  validationErrors: Record<string, string>;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  scrollToField: (fieldId: string) => void;
}

export function useFormValidation(
  options?: UseFormValidationOptions
): UseFormValidationReturn {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, error: string) => {
    setValidationErrors((prev) => ({ ...prev, [field]: error }));
    options?.onValidationError?.(field, error);
  };

  const clearFieldError = (field: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setValidationErrors({});
  };

  const scrollToField = (fieldId: string) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus();
    }
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasErrors,
    scrollToField,
  };
}
