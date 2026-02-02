/**
 * Error Parser Utility
 * Centralizes error handling for Supabase operations
 * Converts database and network errors into user-friendly messages
 */

export interface ParsedError {
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
}

/**
 * Parse Supabase/PostgreSQL error into user-friendly format
 */
export function parseSupabaseError(error: any): ParsedError {
  // Handle null/undefined errors
  if (!error) {
    return {
      title: 'An error occurred',
      description: 'Something went wrong. Please try again.',
      severity: 'error',
      retryable: true,
    };
  }

  // Extract error code and message
  const errorCode = error.code || error.error_code || '';
  const errorMessage = error.message || error.error || String(error);

  // 1. Database Constraint Errors (PostgreSQL error codes)
  if (errorCode) {
    switch (errorCode) {
      case '23505': // Unique constraint violation
        if (errorMessage.includes('staff_email_key')) {
          return {
            title: 'Email already in use',
            description: 'This email address is already assigned to another staff member. Please use a different email.',
            severity: 'error',
            retryable: false,
          };
        }
        return {
          title: 'Duplicate entry',
          description: 'This record already exists. Please check your data and try again.',
          severity: 'error',
          retryable: false,
        };

      case '23514': // Check constraint violation
        if (errorMessage.includes('staff_email_required_when_not_draft')) {
          return {
            title: 'Email is required',
            description: 'Email is required when status is Active or Inactive. Please add an email address.',
            severity: 'error',
            retryable: false,
          };
        }
        return {
          title: 'Invalid data',
          description: 'The data provided does not meet the required constraints. Please check your input.',
          severity: 'error',
          retryable: false,
        };

      case '23503': // Foreign key violation
        return {
          title: 'Related record not found',
          description: 'The referenced record does not exist. Please check your selection and try again.',
          severity: 'error',
          retryable: false,
        };

      case '23502': // Not null violation
        return {
          title: 'Required field missing',
          description: 'A required field is missing. Please fill in all required fields.',
          severity: 'error',
          retryable: false,
        };

      case '23000': // Integrity constraint violation (generic)
        return {
          title: 'Data integrity error',
          description: 'The data violates database constraints. Please check your input and try again.',
          severity: 'error',
          retryable: false,
        };

      case '42501': // Insufficient privilege
        return {
          title: 'Permission denied',
          description: 'You do not have permission to perform this action.',
          severity: 'error',
          retryable: false,
        };

      case 'PGRST116': // Row level security violation
        return {
          title: 'Access denied',
          description: 'You do not have permission to access this resource.',
          severity: 'error',
          retryable: false,
        };
    }
  }

  // 2. Network & Connection Errors (message-based)
  const lowerMessage = errorMessage.toLowerCase();

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('networkerror') ||
    lowerMessage.includes('network request failed')
  ) {
    return {
      title: 'Connection failed',
      description: 'Unable to reach the server. Please check your internet connection and try again.',
      severity: 'error',
      retryable: true,
    };
  }

  if (
    lowerMessage.includes("can't reach database") ||
    lowerMessage.includes('database server') ||
    lowerMessage.includes('connection refused')
  ) {
    return {
      title: 'Database unavailable',
      description: 'Unable to connect to the database. Please try again in a moment.',
      severity: 'error',
      retryable: true,
    };
  }

  if (
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('timeout')
  ) {
    return {
      title: 'Request timed out',
      description: 'The operation took too long to complete. Please try again.',
      severity: 'error',
      retryable: true,
    };
  }

  if (
    lowerMessage.includes('server has closed the connection') ||
    lowerMessage.includes('connection closed')
  ) {
    return {
      title: 'Connection lost',
      description: 'The connection to the server was lost. Please try again.',
      severity: 'error',
      retryable: true,
    };
  }

  if (
    lowerMessage.includes('max client connections') ||
    lowerMessage.includes('connection pool')
  ) {
    return {
      title: 'Server busy',
      description: 'The server is currently busy. Please wait a moment and try again.',
      severity: 'error',
      retryable: true,
    };
  }

  if (lowerMessage.includes('jwt') || lowerMessage.includes('token')) {
    return {
      title: 'Session expired',
      description: 'Your session has expired. Please refresh the page and try again.',
      severity: 'warning',
      retryable: true,
    };
  }

  // 3. Generic Fallback
  return {
    title: 'An error occurred',
    description: errorMessage || 'Something went wrong. Please try again or contact support if the issue persists.',
    severity: 'error',
    retryable: true,
  };
}

/**
 * Helper function to check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const parsed = parseSupabaseError(error);
  return parsed.retryable;
}

/**
 * Helper function to get a simple error message string
 */
export function getErrorMessage(error: any): string {
  const parsed = parseSupabaseError(error);
  return parsed.description;
}
