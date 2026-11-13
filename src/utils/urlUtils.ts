/**
 * URL Utilities for external showcase and portfolio website links.
 * Normalizes user-entered URLs so they open cleanly in a new browser tab.
 */

/**
 * Normalizes any user-entered web link to an absolute clickable URL.
 * - Automatically adds https:// if protocol is omitted (e.g. 'google.com' -> 'https://google.com').
 * - Preserves existing valid schemes (http://, https://, mailto:, tel:).
 * - Converts protocol-relative links ('//example.com' -> 'https://example.com').
 * - Strips leading/trailing whitespace.
 * - Rejects bare schemes like 'https://', 'http://', or empty/dummy placeholders like '#', 'javascript:;'.
 */
export function ensureExternalUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed === '#' ||
    trimmed === 'javascript:void(0)' ||
    trimmed === 'javascript:;' ||
    trimmed.toLowerCase() === 'https://' ||
    trimmed.toLowerCase() === 'http://'
  ) {
    return '';
  }

  // Preserve data/blob URIs or valid relative local server paths (e.g. /uploads/..., /assets/...)
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    return trimmed;
  }

  // Already has a valid protocol
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Protocol relative
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Otherwise prepend https://
  return `https://${trimmed}`;
}

/**
 * Checks whether a given URL is a valid, clickable external link.
 */
export function isValidExternalUrl(rawUrl?: string | null): boolean {
  const normalized = ensureExternalUrl(rawUrl);
  if (!normalized) return false;
  // Must have a scheme and at least one dot or valid target
  return /^(https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(normalized) || normalized.includes('localhost');
}

/**
 * Safely opens an external URL in a new window/tab.
 */
export function openExternalUrl(rawUrl?: string | null, e?: { stopPropagation?: () => void }): void {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  const cleanUrl = ensureExternalUrl(rawUrl);
  if (cleanUrl && typeof window !== 'undefined') {
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  }
}
