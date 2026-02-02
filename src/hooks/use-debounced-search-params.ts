import { useSearchParams } from 'react-router';
import { useCallback, useRef, useEffect } from 'react';

/**
 * A debounced version of useSearchParams from React Router.
 * Updates to the URL are delayed by the specified amount to reduce
 * browser history API calls and minimize status bar appearances.
 * 
 * @param delay - Delay in milliseconds before updating URL (default: 300ms)
 * @returns Tuple of [searchParams, setDebouncedSearchParams]
 */
export function useDebouncedSearchParams(delay: number = 300) {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setDebouncedSearchParams = useCallback(
    (params: URLSearchParams, options?: { replace?: boolean }) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to update URL after delay
      timeoutRef.current = setTimeout(() => {
        setSearchParams(params, options);
      }, delay);
    },
    [setSearchParams, delay]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [searchParams, setDebouncedSearchParams] as const;
}
