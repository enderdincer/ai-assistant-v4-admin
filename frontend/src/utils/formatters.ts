/**
 * Utility functions for formatting timestamps.
 */

/**
 * Format a timestamp as relative time (e.g., "5s ago", "2m ago", "1h ago").
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) {
    return 'Just now';
  }

  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) {
    return 'Just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format service name from snake_case to Title Case.
 */
export function formatServiceName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Truncate a string with ellipsis if it exceeds max length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}
