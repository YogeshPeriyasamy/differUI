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
 * Backend immediately returns { runId } (HTTP 202) and processes the job async.
 */
export async function startCompareSite({ siteName, liveBaseUrl, stagingBaseUrl, pages, selectedDisplayResolution }) {
  return request("/compare-site", {
    method: "POST",
    body: JSON.stringify({ siteName, liveBaseUrl, stagingBaseUrl, pages, selectedDisplayResolution }),
  });
}

/**
 * GET /compare-site/:runId/status
 * Returns { runId, status, phase, progress, result, error }
 * Poll this until status === "done" | "error".
 */
export async function pollRunStatus(runId) {
  return request(`/compare-site/${encodeURIComponent(runId)}/status`); //encodeURIComponent->"https://example.com/search?name=John Doe" to "https%3A%2F%2Fexample.com%2Fsearch%3Fname%3DJohn%20Doe"
}

export async function fetchProgress(runId, { onProgress, onDone, onError }) {
  const eventSource = new EventSource(`${API_BASE}/compare-site/${runId}/status`); //server sent event its like websocket but connects server to browser not browser to server server can send the current progress through this channel
  eventSource.onmessage = (event) => {
    const snap = JSON.parse(event.data);
    if (snap.status === "done") {
      eventSource.close();
      onDone(snap.result);
    } else if (snap.status === "error") {
      eventSource.close();
      onError(snap.error ?? "Unknown error");
    } else {
      onProgress(snap);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    onError("Connection to server lost");
  };

  return eventSource;
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
      img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
