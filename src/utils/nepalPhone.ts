/**
 * Nepal Mobile Phone Number Validation and Formatting Utilities
 * Standard: Exactly 10-digit mobile numbers starting with 98 or 97 (e.g. +97798XXXXXXXX or +97797XXXXXXXX)
 * Country Code: +977 (mandatory and fixed)
 */

export const NEPAL_COUNTRY_CODE = '+977';

export const NEPAL_PHONE_ERROR_MESSAGE =
  'Mobile number must start with +977 followed by exactly 10 digits starting with 98 or 97 (e.g., +97798XXXXXXXX or +97797XXXXXXXX).';

/**
 * Extracts only the raw digits of the local Nepal mobile number (up to 10 digits).
 * Strips away country codes (+977 or 977), spaces, hyphens, and any non-digit characters.
 */
export function extractNepalLocalMobile(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input.trim();
  if (cleaned.startsWith('+977')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('977') && cleaned.replace(/\D/g, '').length >= 12) {
    cleaned = cleaned.slice(3);
  }
  // Strip non-digits
  return cleaned.replace(/\D/g, '');
}

/**
 * Validates a Nepal 10-digit mobile number.
 * Strict rules:
 * - Must have exactly 10 digits.
 * - Must start with 98 or 97.
 * - No letters or invalid symbols permitted.
 * Valid format examples: +97798XXXXXXXX, +97797XXXXXXXX, or local 98XXXXXXXX / 97XXXXXXXX.
 */
export function isValidNepalMobile(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  // Reject letters or invalid characters
  if (/[a-zA-Z]/.test(input)) return false;

  const digits = extractNepalLocalMobile(input);
  // Must be exactly 10 digits starting with 98 or 97
  return /^(98|97)\d{8}$/.test(digits);
}

/**
 * Validates input as the user is typing, providing specific diagnostic error messages.
 */
export function getNepalMobileValidationError(digits: string): string | null {
  if (!digits) return 'Mobile number is required.';
  if (digits.length >= 1 && digits.charAt(0) !== '9') {
    return 'Nepal mobile numbers must start with 98 or 97.';
  }
  if (digits.length >= 2) {
    const prefix = digits.slice(0, 2);
    if (prefix !== '98' && prefix !== '97') {
      return `Invalid prefix "${prefix}". Number must start with 98 or 97.`;
    }
  }
  if (digits.length < 10) {
    return `Must be exactly 10 digits after +977 (currently ${digits.length}/10).`;
  }
  if (digits.length > 10) {
    return 'Cannot exceed 10 digits after +977.';
  }
  if (!/^(98|97)\d{8}$/.test(digits)) {
    return NEPAL_PHONE_ERROR_MESSAGE;
  }
  return null;
}

/**
 * Formats a 10-digit mobile number with the fixed Nepal country code:
 * Returns '+97798XXXXXXXX' or '+97797XXXXXXXX'
 */
export function formatFullNepalMobile(input: string): string {
  const local = extractNepalLocalMobile(input).slice(0, 10);
  if (!local) return '';
  return `${NEPAL_COUNTRY_CODE}${local}`;
}

/**
 * Formats for display with a space for readability:
 * e.g., '+977 98XXXXXXXX' or '+977 97XXXXXXXX'
 */
export function formatDisplayNepalMobile(input: string): string {
  const local = extractNepalLocalMobile(input).slice(0, 10);
  if (!local) return '';
  return `${NEPAL_COUNTRY_CODE} ${local}`;
}
