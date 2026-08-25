/**
 * services/api.js
 * Thin fetch abstraction over the backend REST API.
 * All calls go through these helpers — no raw fetch() in page components.
 */

import { API_BASE } from "../config/env";

// ── Internal helper ────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status} ${res.statusText}`);
  }

  return data;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * GET /pages?liveUrl=...&stagingUrl=...
 * Returns { siteKey, pages: [{ id, label, path }] }
 */
export async function fetchPages(liveUrl, stagingUrl) {
  const params = new URLSearchParams({ liveUrl, stagingUrl });
  return request(`/pages?${params}`);
}

/**
 * POST /compare-site
 * Returns { runId, runDate, runTime, results: [...] }
 */
export async function compareSite({ siteName, liveBaseUrl, stagingBaseUrl, pages, selectedDisplayResolution }) {
  return request("/compare-site", {
    method: "POST",
    body: JSON.stringify({ siteName, liveBaseUrl, stagingBaseUrl, pages, selectedDisplayResolution }),
  });
}

/**
 * Resolves a relative image path returned by the backend to a full URL.
 * Absolute URLs, data URIs, and blob URLs are returned unchanged.
 */
export function resolveImageUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const clean = url.startsWith("/") ? url : `/${url.replace(/^\.?\//, "")}`;
  return `${API_BASE}${clean}`;
}

/**
 * Fetches an image and returns a data URL together with its natural dimensions.
 * Used by the PDF export to embed screenshots without CORS issues.
 */
export async function fetchImageAsDataUrl(url) {
  const resolvedUrl = resolveImageUrl(url);
  const res = await fetch(resolvedUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${resolvedUrl}`);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload  = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
