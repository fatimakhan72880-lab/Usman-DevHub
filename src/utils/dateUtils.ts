/**
 * Date Formatting and Normalization Utilities for Order Agreements and Official SOWs.
 * Ensures consistent, timezone-safe display across browser environments, mobile devices, and PDF vectors.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD for native <input type="date" />
 */
export function getTodayInputDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes any date string (ISO, timestamp, YYYY-MM-DD) into YYYY-MM-DD format for input elements
 */
export function toInputDateFormat(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return getTodayInputDate();
  }
  const trimmed = dateStr.trim();
  // Already in YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    return trimmed;
  }
  // If ISO string or parseable
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback
  }
  return getTodayInputDate();
}

/**
 * Formats an agreement date string into an official human-readable format (e.g. "Oct 28, 2026")
 * Timezone-safe for YYYY-MM-DD strings so local timezone offsets don't shift the day backwards.
 */
export function formatAgreementDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const trimmed = dateStr.trim();

  // Handle YYYY-MM-DD explicitly to prevent UTC midnight timezone shift
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]) - 1;
    const day = Number(ymdMatch[3]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  // Handle ISO string or date parse
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch {
    // ignore
  }

  // If custom text entered by user (e.g., "October 28, 2026"), return directly
  return trimmed;
}
