/**
 * hooks/useCompare.js
 * Manages the compare workflow state: fetching available pages and
 * triggering the comparison run.
 */

import { useState, useRef, useCallback } from "react";
import { fetchPages, compareSite } from "../services/api";
import { isValidUrl, isSameSite, toOrigin } from "../utils/url";

export function useCompare({ onRunComplete }) {
  const [liveUrl, setLiveUrl] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [fetchState, setFetchState] = useState("idle"); // idle | loading | done | error
  const [siteKey, setSiteKey] = useState(null);
  const [pageList, setPageList] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [running, setRunning] = useState(false);

  // Keeps the cleaned origins from the last successful fetch
  const fetchedUrls = useRef({ live: "", staging: "" });

  // ── URL change ─────────────────────────────────────────────────────────────
  const handleLiveChange = useCallback((value) => {
    setLiveUrl(value);
    resetFetchedState();
  }, []);

  const handleStagingChange = useCallback((value) => {
    setStagingUrl(value);
    resetFetchedState();
  }, []);

  function resetFetchedState() {
    setUrlError("");
    setSiteKey(null);
    setPageList([]);
    setSelectedPages([]);
    setFetchState("idle");
    fetchedUrls.current = { live: "", staging: "" };
  }

  // ── Inline validation ──────────────────────────────────────────────────────
  function validateUrls() {
    if (!liveUrl && !stagingUrl) return true;
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

  // ── Fetch pages ────────────────────────────────────────────────────────────
  const handleFetchPages = useCallback(async () => {
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

    const cleanLive = toOrigin(liveUrl);
    const cleanStaging = toOrigin(stagingUrl);

    try {
      const data = await fetchPages(cleanLive, cleanStaging);
      setSiteKey(data.siteKey);
      setPageList(data.pages ?? []);
      setFetchState("done");
      fetchedUrls.current = { live: cleanLive, staging: cleanStaging };
    } catch (err) {
      setUrlError(err.message || "Could not reach the server. Make sure the backend is running.");
      setFetchState("error");
    }
  }, [liveUrl, stagingUrl]);

  // ── Page selection ─────────────────────────────────────────────────────────
  const togglePage = useCallback((id) => {
    setSelectedPages((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  const selectAll = useCallback(() => setSelectedPages(pageList.map((p) => p.id)), [pageList]);
  const clearAll = useCallback(() => setSelectedPages([]), []);

  // ── Run comparison ─────────────────────────────────────────────────────────
  const handleRun = useCallback(
    async (selectedDisplay) => {
      if (!siteKey || selectedPages.length === 0 || running) return;
      setRunning(true);
      try {
        console.log("selected Display",selectedDisplay );
        const data = await compareSite({
          siteName: siteKey,
          liveBaseUrl: fetchedUrls.current.live,
          stagingBaseUrl: fetchedUrls.current.staging,
          pages: selectedPages,
          selectedDisplayResolution: selectedDisplay,
        });
        onRunComplete(data);
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        setRunning(false);
      }
    },
    [siteKey, selectedPages, running, onRunComplete],
  );

  const canFetch = liveUrl.trim() && stagingUrl.trim() && !urlError && fetchState !== "loading";
  const canRun = fetchState === "done" && siteKey && selectedPages.length > 0 && !running;

  return {
    // URL fields
    liveUrl,
    stagingUrl,
    urlError,
    handleLiveChange,
    handleStagingChange,
    validateUrls,
    // Fetch
    fetchState,
    siteKey,
    pageList,
    handleFetchPages,
    canFetch,
    // Page selection
    selectedPages,
    togglePage,
    selectAll,
    clearAll,
    // Run
    running,
    canRun,
    handleRun,
  };
}
