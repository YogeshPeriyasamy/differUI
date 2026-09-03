/**
 * utils/url.js
 * Pure URL validation and normalisation helpers.
 * No side effects — safe to import anywhere.
 */

/**
 * Returns true for http:// or https:// URLs.
 */
export function isValidUrl(urlStr) {
  try {
    const { protocol } = new URL(urlStr);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Strips any path/query/hash so callers always send a clean origin to the backend.
 * e.g. "https://knowesr1.com/index.html" → "https://knowesr1.com"
 */
export function toOrigin(urlStr) {
  try {
    return new URL(urlStr).origin;
  } catch {
    return urlStr.replace(/\/+$/, "");
  }
}

/**
 * Extracts a normalised site token from a hostname.
 * Strips www., takes the first segment, and removes trailing version suffixes
 * (_v1, _v4, _copy) so "elzonris_v1.teststl.com" and "elzonris.com" both
 * produce "elzonris".
 */
export function extractSiteToken(urlStr) {
  try {
    const host = new URL(urlStr).hostname.toLowerCase().replace(/^www\./, "");
    const first = host.split(".")[0];
    return first.replace(/_v\d+$/, "").replace(/_copy$/, "");
  } catch {
    return null;
  }
}

/**
 * Returns true when two URLs appear to belong to the same site.
 * This is an intentionally permissive client-side check; authoritative
 * validation is done on the backend.
 */
export function isSameSite(urlA, urlB) {
  const a = extractSiteToken(urlA);
  const b = extractSiteToken(urlB);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
  
  // return a == b; // strict validation to find live and straging url for same site
}
