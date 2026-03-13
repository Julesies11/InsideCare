import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export type ErrorCategory = 'database' | 'network' | 'auth' | 'validation' | 'unknown';

interface ErrorOptions {
  category?: ErrorCategory;
  title?: string;
  showToast?: boolean;
  logToConsole?: boolean;
  logToDatabase?: boolean;
}

const OFFLINE_ERRORS_KEY = 'insidecare_offline_errors';

interface ErrorLogPayload {
  message: string;
  category: string;
  details: any;
  url: string;
  user_agent: string;
  app_version: string;
  user_id?: string;
}

/**
 * Saves error to localStorage if offline or if DB insert fails
 */
function saveErrorOffline(payload: ErrorLogPayload) {
  try {
    const existing = localStorage.getItem(OFFLINE_ERRORS_KEY);
    const errors: ErrorLogPayload[] = existing ? JSON.parse(existing) : [];
    errors.push(payload);
    // Keep only the last 50 to prevent localStorage bloat
    if (errors.length > 50) errors.shift();
    localStorage.setItem(OFFLINE_ERRORS_KEY, JSON.stringify(errors));
  } catch (e) {
    console.error('Failed to save error offline', e);
  }
}

/**
 * Attempts to sync offline errors to Supabase
 */
export async function syncOfflineErrors() {
  if (!navigator.onLine) return;

  try {
    const existing = localStorage.getItem(OFFLINE_ERRORS_KEY);
    if (!existing) return;

    const errors: ErrorLogPayload[] = JSON.parse(existing);
    if (errors.length === 0) return;

    const { error } = await supabase.from('error_logs').insert(errors);
    
    if (!error) {
      localStorage.removeItem(OFFLINE_ERRORS_KEY);
      console.log(`Synced ${errors.length} offline errors`);
    }
  } catch (e) {
    console.error('Failed to sync offline errors', e);
  }
}

// Add a listener to sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineErrors);
}

/**
 * Centralized error handler for the application.
 * Categorizes errors and provides consistent UI feedback and logging.
 */
export const handleError = (error: unknown, options: ErrorOptions = {}) => {
  const { 
    category = 'unknown', 
    title = 'An error occurred', 
    showToast = true, 
    logToConsole = true,
    logToDatabase = true,
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

  // 3. Log to database
  if (logToDatabase && category !== 'validation') {
    const payload: ErrorLogPayload = {
      message: message,
      category,
      details: {
        title,
        original_error: err?.message || err,
        code: err?.code,
        hint: err?.hint,
        stack: err?.stack,
      },
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      app_version: import.meta.env.VITE_APP_VERSION || '1.0.0', // Using env var if available
    };

    // Fire and forget
    supabase.auth.getUser().then(({ data }) => {
      payload.user_id = data?.user?.id;
      
      if (!navigator.onLine) {
        saveErrorOffline(payload);
        return;
      }

      supabase.from('error_logs').insert([payload]).then(({ error: insertError }) => {
        if (insertError) {
          console.error('Failed to log error to database', insertError);
          saveErrorOffline(payload);
        }
      });
    }).catch(() => {
      // If getting user fails, log without user_id
      saveErrorOffline(payload);
    });
  }

  // 4. Show UI Notification
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
  return handleError(message, { category: 'validation', title: title || 'Validation Failed', logToDatabase: false });
};
