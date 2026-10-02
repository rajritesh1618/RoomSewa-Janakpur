/**
 * Email validation utility for Gmail-only login and registration.
 */

export const GMAIL_ERROR_MESSAGE = 'Please enter a valid Gmail address (example@gmail.com).';

/**
 * Validates that an input is a valid Gmail address ending strictly with @gmail.com.
 * Rejects empty emails, invalid formats, or non-Gmail domains.
 * Example valid: username@gmail.com, my.name123@gmail.com
 */
export function isValidGmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed) return false;

  // Must strictly end with @gmail.com (case-insensitive)
  // Username must be standard email username characters before @gmail.com
  const gmailRegex = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@gmail\.com$/i;
  return gmailRegex.test(trimmed);
}
