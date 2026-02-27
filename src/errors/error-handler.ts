import { toast } from 'sonner';

export type ErrorCategory = 'database' | 'network' | 'auth' | 'validation' | 'unknown';

interface ErrorOptions {
  category?: ErrorCategory;
  title?: string;
  showToast?: boolean;
  logToConsole?: boolean;
}

/**
 * Centralized error handler for the application.
 * Categorizes errors and provides consistent UI feedback.
 */
export const handleError = (error: any, options: ErrorOptions = {}) => {
  const { 
    category = 'unknown', 
    title = 'An error occurred', 
    showToast = true, 
    logToConsole = true 
  } = options;

  // 1. Log to console for developers
  if (logToConsole) {
    console.group(`[Error][${category.toUpperCase()}] ${title}`);
    console.error(error);
    if (error?.details) console.error('Details:', error.details);
    if (error?.hint) console.info('Hint:', error.hint);
    console.groupEnd();
  }

  // 2. Extract user-friendly message
  let message = 'Something went wrong. Please try again.';
  
  if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  }

  // Handle specific Supabase error codes
  if (error?.code) {
    switch (error.code) {
      case 'PGRST204':
        message = 'The requested resource was not found.';
        break;
      case '42501':
        message = 'You do not have permission to perform this action.';
        break;
      case '23505':
        message = 'A record with this information already exists.';
        break;
    }
  }

  // 3. Show UI Notification
  if (showToast) {
    toast.error(title, {
      description: message,
      duration: 5000,
    });
  }

  return { message, category, originalError: error };
};

/**
 * Specifically handles Supabase response errors
 */
export const handleSupabaseError = (error: any, title?: string) => {
  return handleError(error, { category: 'database', title: title || 'Database Error' });
};

/**
 * Specifically handles validation errors (e.g., from Zod or manual checks)
 */
export const handleValidationError = (message: string, title?: string) => {
  return handleError(message, { category: 'validation', title: title || 'Validation Failed' });
};
