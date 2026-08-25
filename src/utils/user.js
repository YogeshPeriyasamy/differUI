/**
 * utils/user.js
 * Pure helpers for user/session data.
 */

const STORAGE_KEY = "vdt_user";

export const getStoredUser  = ()      => localStorage.getItem(STORAGE_KEY) ?? "";
export const storeUser      = (email) => localStorage.setItem(STORAGE_KEY, email);
export const clearStoredUser = ()     => localStorage.removeItem(STORAGE_KEY);

/**
 * Derives two-letter initials from an email address.
 * "jane.doe@example.com"  →  "JD"
 * "admin@example.com"     →  "AD"
 */
export function getInitials(email) {
  if (!email) return "JD";
  const namePart = email.split("@")[0];
  const parts    = namePart.split(/[._-]/);
  return parts.length > 1 && parts[1]
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : namePart.slice(0, 2).toUpperCase();
}
