/**
 * Returns a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generates initials from a name string for use in avatar fallbacks.
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Formats a timestamp into a human-readable string (e.g., "10:30 AM").
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * NOTE: This is a simple, non-secure obfuscation method for demonstration purposes only.
 * It is NOT suitable for production use. A real application must use proper hashing (e.g., bcrypt).
 * It simply reverses the string and converts it to base64.
 */
export function simpleObfuscate(password: string): string {
  try {
    const reversed = password.split('').reverse().join('');
    return btoa(reversed);
  } catch (e) {
    console.error("Failed to obfuscate password:", e);
    return '';
  }
}