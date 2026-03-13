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
export const handleError = (error: unknown, options: ErrorOptions = {}) => {
  const { 
    category = 'unknown', 
    title = 'An error occurred', 
    showToast = true, 
    logToConsole = true 
  } = options;

  const err = error as any;

  // 1. Log to console for developers
  if (logToConsole) {
    console.group(`[Error][${category.toUpperCase()}] ${title}`);
    console.error(error);
    if (err?.details) console.error('Details:', err.details);
    if (err?.hint) console.info('Hint:', err.hint);
    console.groupEnd();
  }

  // 2. Extract user-friendly message
  let message = 'Something went wrong. Please try again.';
  
  if (typeof error === 'string') {
    message = error;
  } else if (err?.message) {
    message = err.message;
  }

  // Handle specific Supabase error codes
  if (err?.code) {
    switch (err.code) {
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
export const handleSupabaseError = (error: unknown, title?: string) => {
  return handleError(error, { category: 'database', title: title || 'Database Error' });
};

/**
 * Specifically handles validation errors (e.g., from Zod or manual checks)
 */
export const handleValidationError = (message: string, title?: string) => {
  return handleError(message, { category: 'validation', title: title || 'Validation Failed' });
};
