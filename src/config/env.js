/**
 * config/env.js
 * Single source of truth for every runtime environment variable.
 * All VITE_ values come from .env — never hard-code URLs or secrets elsewhere.
 */

/** Backend API base URL, e.g. http://localhost:4000  */
export const API_BASE = (() => {
  const configured = import.meta.env.VITE_API_BASE;
  if (configured) return configured.replace(/\/$/, ""); // strip trailing slash
  // Fallback: same host, port 4000 (dev convenience only)
  return `${window.location.protocol}//${window.location.hostname}:4000`;
})();

/** Admin credentials — */
export const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL    ?? "";
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";
