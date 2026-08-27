/**
 * hooks/useCompare.js
 * Manages the compare workflow: URL validation, page fetching, and the
 * async comparison run with real-time progress polling.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { fetchPages, startCompareSite, pollRunStatus, fetchProgress, deleteRun } from "../services/api";
import { isValidUrl, isSameSite, toOrigin } from "../utils/url";

// const POLL_INTERVAL_MS = 1500; // how often to hit GET /compare-site/:id/status

export function useCompare({ onRunComplete }) {
  const [liveUrl, setLiveUrl] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [fetchState, setFetchState] = useState("idle"); // idle | loading | done | error
  const [siteKey, setSiteKey] = useState(null);
  const [pageList, setPageList] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);

  // running: is a comparison run in progress?
  const [running, setRunning] = useState(false);
  // runProgress: { phase: string, progress: number } — fed to RunningLoader
  const [runProgress, setRunProgress] = useState({ phase: "Initialising", progress: 0 });

  const fetchedUrls = useRef({ live: "", staging: "" });
  const eventSourceRef = useRef(null);

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

  // ── Polling helpers ────────────────────────────────────────────────────────
  // function stopPolling() {
  //   if (eventSourceRef.current) {
  //     clearInterval(eventSourceRef.current);
  //     eventSourceRef.current = null;
  //   }
  // }
  function stopPolling() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }

  function startPolling(runId) {
    stopPolling();

    eventSourceRef.current = fetchProgress(runId, {
      onProgress: (snap) => {
        setRunProgress({ phase: snap.phase ?? "Running", progress: snap.progress ?? 0 });
      },
      onDone: (result) => {
        setRunProgress({ phase: "Done", progress: 100 });
        setTimeout(() => {
          setRunning(false);
          onRunComplete(result);
        }, 600);
      },
      onError: (msg) => {
        stopPolling();
        setRunning(false);
        setRunProgress({ phase: "Initialising", progress: 0 });
        alert(`Comparison failed: ${msg}`);
      },
    });
  }

  // function startPolling(runId) {
  //   stopPolling(); // safety: clear any stale timer

  //   eventSourceRef.current = setInterval(async () => {
  //     try {
  //       const snap = await pollRunStatus(runId);

  //       // Mirror backend phase + progress into state so RunningLoader can read it
  //       setRunProgress({ phase: snap.phase ?? "Running", progress: snap.progress ?? 0 });

  //       if (snap.status === "done") {
  //         stopPolling();
  //         setRunProgress({ phase: "Done", progress: 100 });
  //         setTimeout(() => {
  //           setRunning(false);
  //           onRunComplete(snap.result);
  //         }, 600);
  //       } else if (snap.status === "error") {
  //         stopPolling();
  //         setRunning(false);
  //         setRunProgress({ phase: "Initialising", progress: 0 });
  //         alert(`Comparison failed: ${snap.error ?? "Unknown error"}`);
  //       }
  //     } catch (err) {
  //       // Network blip — keep polling; don't abort unless the error is permanent
  //       console.warn("[useCompare] Poll error (will retry):", err.message);
  //     }
  //   }, POLL_INTERVAL_MS);
  // }

  // ── Run comparison ─────────────────────────────────────────────────────────
  const handleRun = useCallback(
    async (selectedDisplay) => {
      if (!siteKey || selectedPages.length === 0 || running) return;

      setRunning(true);
      setRunProgress({ phase: "Initialising", progress: 0 });

      try {
        const activeRunId = localStorage.getItem("activeRunId")
        console.log("active runId ref...........", );
        if (activeRunId) {
          await deleteRun(activeRunId);    
          localStorage.removeItem("activeRunId");
        }

        const { runId } = await startCompareSite({
          siteName: siteKey,
          liveBaseUrl: fetchedUrls.current.live,
          stagingBaseUrl: fetchedUrls.current.staging,
          pages: selectedPages,
          selectedDisplayResolution: selectedDisplay,
        });

        localStorage.setItem("activeRunId", runId);

        startPolling(runId);
      } catch (err) {
        setRunning(false);
        setRunProgress({ phase: "Initialising", progress: 0 });
        alert(`Failed to start comparison: ${err.message}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    runProgress,
    canRun,
    handleRun,
  };
}
