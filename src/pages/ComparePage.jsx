import React, { useState, useRef } from "react";

const API_BASE = "http://localhost:4000";

// ---------------------------------------------------------------------------
// Lightweight same-site validation.
// Extracts the "core" hostname by stripping www. and the first subdomain
// segment — so knowesr1.com and knowesr1_v4.teststl.com both reduce to a
// token that contains "knowesr1".
//
// This is intentionally permissive: full verification is done on the backend.
// We only block obviously mismatched domains here so the user gets instant
// feedback without a round-trip.
// ---------------------------------------------------------------------------
function extractSiteToken(urlStr) {
  try {
    const host = new URL(urlStr).hostname.toLowerCase().replace(/^www\./, "");
    // grab the part before any first dot  →  "elzonris", "knowesr1", etc.
    // also handle teststl subdomains like "elzonris_v1.teststl.com"
    const firstSegment = host.split(".")[0];
    // strip trailing version suffixes like _v1 / _v4
    return firstSegment.replace(/_v\d+$/, "").replace(/_copy$/, "");
  } catch {
    return null;
  }
}

function isSameSite(liveUrl, stagingUrl) {
  const a = extractSiteToken(liveUrl);
  const b = extractSiteToken(stagingUrl);
  if (!a || !b) return false;
  // one token must contain the other (handles slight naming differences)
  return a.includes(b) || b.includes(a);
}

function isValidUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Returns just the origin (protocol + host + port), stripping any path the
// user may have typed.  e.g. "https://knowesr1.com/index.html" → "https://knowesr1.com"
function toOrigin(urlStr) {
  try {
    return new URL(urlStr).origin;
  } catch {
    return urlStr.replace(/\/+$/, "");
  }
}

// ---------------------------------------------------------------------------
export default function ComparePage({ onRun }) {
  const [liveUrl,       setLiveUrl]       = useState("");
  const [stagingUrl,    setStagingUrl]    = useState("");
  const [urlError,      setUrlError]      = useState("");           // validation msg
  const [fetchState,    setFetchState]    = useState("idle");       // idle | loading | done | error
  const [siteKey,       setSiteKey]       = useState(null);
  const [pageList,      setPageList]      = useState([]);           // [{ id, label, path }]
  const [selectedPages, setSelectedPages] = useState([]);
  const [running,       setRunning]       = useState(false);

  // Track the URLs that were used for the last successful fetch, so we can
  // detect when the user changes them and reset the page list.
  const fetchedUrls = useRef({ live: "", staging: "" });

  // ── URL change handlers ───────────────────────────────────────────────────
  function handleLiveChange(e) {
    setLiveUrl(e.target.value);
    resetFetchedState();
  }

  function handleStagingChange(e) {
    setStagingUrl(e.target.value);
    resetFetchedState();
  }

  function resetFetchedState() {
    setUrlError("");
    setSiteKey(null);
    setPageList([]);
    setSelectedPages([]);
    setFetchState("idle");
    fetchedUrls.current = { live: "", staging: "" };
  }

  // ── Inline validation (on blur of either field) ───────────────────────────
  function validateUrls() {
    if (!liveUrl && !stagingUrl) return true;   // both empty — nothing to say yet

    if (liveUrl && !isValidUrl(liveUrl)) {
      setUrlError("Live URL is not a valid URL.");
      return false;
    }
    if (stagingUrl && !isValidUrl(stagingUrl)) {
      setUrlError("Staging URL is not a valid URL.");
      return false;
    }
    if (liveUrl && stagingUrl && !isSameSite(liveUrl, stagingUrl)) {
      setUrlError("These URLs appear to be for different sites. Please check and try again.");
      return false;
    }
    setUrlError("");
    return true;
  }

  // ── Fetch pages from backend ──────────────────────────────────────────────
  async function handleFetchPages() {
    setUrlError("");

    if (!liveUrl || !stagingUrl) {
      setUrlError("Please enter both Live and Staging URLs.");
      return;
    }
    if (!isValidUrl(liveUrl)) {
      setUrlError("Live URL is not a valid URL.");
      return;
    }
    if (!isValidUrl(stagingUrl)) {
      setUrlError("Staging URL is not a valid URL.");
      return;
    }
    if (!isSameSite(liveUrl, stagingUrl)) {
      setUrlError("These URLs appear to be for different sites. Please check and try again.");
      return;
    }

    setFetchState("loading");
    setSiteKey(null);
    setPageList([]);
    setSelectedPages([]);

    // Always send the origin (protocol + host) only — strip any path the user
    // may have included, so the backend uses a clean base URL.
    const cleanLive    = toOrigin(liveUrl);
    const cleanStaging = toOrigin(stagingUrl);

    try {
      const params = new URLSearchParams({ liveUrl: cleanLive, stagingUrl: cleanStaging });
      const res    = await fetch(`${API_BASE}/pages?${params}`);
      const data   = await res.json();

      if (!res.ok) {
        setUrlError(data.message || "Failed to fetch pages.");
        setFetchState("error");
        return;
      }

      setSiteKey(data.siteKey);
      setPageList(data.pages ?? []);
      setFetchState("done");
      // Store the cleaned origins — these are what we'll send to /compare-site
      fetchedUrls.current = { live: cleanLive, staging: cleanStaging };
    } catch (err) {
      setUrlError("Could not reach the server. Make sure the backend is running.");
      setFetchState("error");
    }
  }

  // ── Page selection helpers ────────────────────────────────────────────────
  function togglePage(id) {
    setSelectedPages((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function selectAll()  { setSelectedPages(pageList.map((p) => p.id)); }
  function clearAll()   { setSelectedPages([]); }

  // ── Run ───────────────────────────────────────────────────────────────────
  async function handleRun() {
    if (!canRun) return;
    setRunning(true);
    try {
      // Always use the cleaned origins we confirmed during the fetch step
      await onRun(siteKey, selectedPages, fetchedUrls.current.live, fetchedUrls.current.staging);
    } finally {
      setRunning(false);
    }
  }

  const canFetch = liveUrl.trim() && stagingUrl.trim() && !urlError && fetchState !== "loading";
  const canRun   = fetchState === "done" && siteKey && selectedPages.length > 0 && !running;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="compare-card">

        {/* ── URL inputs ── */}
        <div className="compare-sub" style={{ marginBottom: 20 }}>
          Enter the <strong style={{ color: "#16a34a" }}>Live</strong> and{" "}
          <strong style={{ color: "#d97706" }}>Staging</strong> base URLs for the site you want to compare.
        </div>

        <div className="field-group">
          <div className="field-label">
            <span className="env-indicator" style={{ background: "#16a34a" }} />
            Live URL
          </div>
          <input
            className="url-input"
            placeholder="https://elzonris.com"
            value={liveUrl}
            onChange={handleLiveChange}
            onBlur={validateUrls}
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="field-group">
          <div className="field-label">
            <span className="env-indicator" style={{ background: "#d97706" }} />
            Staging URL
          </div>
          <input
            className="url-input"
            placeholder="https://elzonris_v1.teststl.com"
            value={stagingUrl}
            onChange={handleStagingChange}
            onBlur={validateUrls}
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* ── Validation error ── */}
        {urlError && (
          <div className="url-error-msg">
            <span style={{ marginRight: 6 }}>⚠</span>{urlError}
          </div>
        )}

        {/* ── Fetch Pages button ── */}
        <button
          className="fetch-pages-btn"
          onClick={handleFetchPages}
          disabled={!canFetch}
        >
          {fetchState === "loading" ? (
            <>
              <span className="btn-mini-spinner" />
              Fetching pages…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}>
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
              </svg>
              Fetch Pages
            </>
          )}
        </button>

        {/* ── Site key confirmation ── */}
        {fetchState === "done" && siteKey && (
          <div className="site-key-badge">
            <span className="site-key-dot" />
            Matched site: <strong>{siteKey}</strong> &mdash; {pageList.length} page{pageList.length !== 1 ? "s" : ""} available
          </div>
        )}

        {/* ── Page selector (shown only after successful fetch) ── */}
        {fetchState === "done" && pageList.length > 0 && (
          <div className="field-group" style={{ marginTop: 20 }}>
            <div className="field-label" style={{ justifyContent: "space-between" }}>
              <span>Select Pages</span>
              <span className="page-sel-actions">
                <button className="text-action-btn" onClick={selectAll}>Select all</button>
                <span className="text-action-sep">·</span>
                <button className="text-action-btn" onClick={clearAll}>Clear</button>
              </span>
            </div>

            <div className="page-checkbox-list">
              {pageList.map((p) => {
                const checked = selectedPages.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`page-checkbox-item${checked ? " page-checkbox-item-checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePage(p.id)}
                      className="page-checkbox-input"
                    />
                    <span className="page-checkbox-label">{p.label}</span>
                    <span className="page-checkbox-path">{p.path}</span>
                    {checked && <span className="page-checkbox-tick">✓</span>}
                  </label>
                );
              })}
            </div>

            {selectedPages.length > 0 && (
              <div className="page-sel-summary">
                {selectedPages.length} of {pageList.length} page
                {pageList.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>
        )}

        <hr className="divider" />

        <button className="run-btn" disabled={!canRun} onClick={handleRun}>
          {running ? (
            <>
              <span className="btn-mini-spinner btn-mini-spinner-white" />
              Running…
            </>
          ) : (
            <>▶ Run Comparison</>
          )}
        </button>
      </div>
    </div>
  );
}
