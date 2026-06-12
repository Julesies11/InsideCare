export const throttle = (
  func: (...args: unknown[]) => void,
  limit: number,
): ((...args: unknown[]) => void) => {
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number | null = null;

  return function (this: unknown, ...args: unknown[]) {
    if (lastRan === null) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      if (lastFunc !== null) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(
        () => {
          if (Date.now() - (lastRan as number) >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - (lastRan as number)),
      );
    }
  };
};

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function uid(): string {
  return (Date.now() + Math.floor(Math.random() * 1000)).toString();
}

export function getInitials(
  name: string | null | undefined,
  count?: number,
): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase());

  return count && count > 0
    ? initials.slice(0, count).join('')
    : initials.join('');
}

export function toAbsoluteUrl(pathname: string): string {
  const baseUrl = import.meta.env.BASE_URL;

  if (baseUrl && baseUrl !== '/') {
    return import.meta.env.BASE_URL + pathname;
  } else {
    return pathname;
  }
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((now.getTime() - inputDate.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600)
    return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''} ago`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 604800)
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  if (diff < 2592000)
    return `${Math.floor(diff / 604800)} week${Math.floor(diff / 604800) > 1 ? 's' : ''} ago`;
  if (diff < 31536000)
    return `${Math.floor(diff / 2592000)} month${Math.floor(diff / 2592000) > 1 ? 's' : ''} ago`;

  return `${Math.floor(diff / 31536000)} year${Math.floor(diff / 31536000) > 1 ? 's' : ''} ago`;
}

export function formatDate(input: Date | string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(input: Date | string | number): string {
  const date = new Date(input);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

/**
 * Returns the SVG filename for a given file extension.
 * Used for displaying consistent file-type icons.
 */
export function getFileIcon(fileName?: string): string {
  if (!fileName) return 'doc.svg';
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf.svg';
    case 'doc':
    case 'docx':
      return 'word.svg';
    case 'xls':
    case 'xlsx':
      return 'excel.svg';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'svg':
    case 'webp':
      return 'image.svg';
    case 'txt':
      return 'text.svg';
    case 'zip':
    case 'rar':
    case '7z':
      return 'zip.svg';
    default:
      return 'doc.svg';
  }
}

/**
 * Extracts a human-readable filename from a Supabase storage URL or path.
 * Handles signed URLs and removes timestamp prefixes (e.g., 1700000000000-file.pdf).
 */
export function getFilenameFromStorageUrl(
  url: string | null | undefined,
): string {
  if (!url) return 'Existing attachment';
  try {
    const pathPart = url.split('?')[0];
    const parts = pathPart.split('/');
    const lastPart = parts[parts.length - 1];
    const decoded = decodeURIComponent(lastPart);
    const match = decoded.match(/^\d{13}-(.+)$/);
    if (match) return match[1];
    return decoded || 'Existing attachment';
  } catch (e) {
    return 'Existing attachment';
  }
}

/**
 * Extracts a storage path relative to the bucket from a full Supabase storage URL.
 * If the input is already a path, it returns it as-is.
 * Example: https://.../object/public/bucket/path/to/file -> path/to/file
 */
export function getStoragePath(url: string | null | undefined): string {
  if (!url) return '';
  // If it's not a URL, assume it's already a path
  if (!url.startsWith('http')) return url;

  try {
    // Supabase URL pattern: /storage/v1/object/(public|authenticated|sign)/bucket-name/path/to/file
    const searchStr = '/storage/v1/object/';
    const index = url.indexOf(searchStr);
    if (index === -1) return url;

    const remaining = url.substring(index + searchStr.length);
    const parts = remaining.split('/');
    // parts[0] is 'public' or 'authenticated' or 'sign'
    // parts[1] is the bucket name
    // The rest is the path
    return parts.slice(2).join('/').split('?')[0];
  } catch (e) {
    return url;
  }
}
