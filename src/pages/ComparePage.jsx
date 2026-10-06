import React, { useState } from "react";
import { useCompare } from "../hooks/useCompare";
import RunningLoader from "../components/RunningLoader";
import deskTopLogo from "../../assets/desktopLogo.png";
import mobileLogo from "../../assets/mobileLogo.png";

export default function ComparePage({ onRunComplete }) {
  const {
    liveUrl,
    stagingUrl,
    urlError,
    handleLiveChange,
    handleStagingChange,
    validateUrls,
    fetchState,
    siteKey,
    pageList,
    addedPages,
    deletedPages,
    handleFetchPages,
    canFetch,
    selectedPages,
    togglePage,
    selectAll,
    clearAll,
    running,
    runProgress,
    canRun,
    handleRun,
    threshold,
    setThreshold,
  } = useCompare({ onRunComplete });

  const [activeResolutionSelector, setActiveResolutionSelector] = useState("desktop");

  return (
    <>
      {/* Fullscreen overlay — rendered outside the card so it covers everything */}
      <RunningLoader
        visible={running}
        phase={runProgress.phase}
        progress={runProgress.progress}
      />

      <div className="fade-in">
      <div className={`compare-card${running ? " compare-disabled" : ""}`}>
        {/* ── Instructions ── */}
        <div className="compare-sub" style={{ marginBottom: 20 }}>
          Enter the <strong style={{ color: "#16a34a" }}>Live</strong> and <strong style={{ color: "#d97706" }}>Staging</strong> base URLs
          for the site you want to compare.
        </div>

        {/* ── Live URL ── */}
        <div className="field-group">
          <div className="field-label">
            <span className="env-indicator" style={{ background: "#16a34a" }} />
            Live URL
          </div>
          <input
            className="url-input"
            placeholder="https://elzonris.com"
            value={liveUrl}
            onChange={(e) => handleLiveChange(e.target.value)}
            onBlur={validateUrls}
            autoComplete="off"
            spellCheck="false"
            disabled={running}
          />
        </div>

        {/* ── Staging URL ── */}
        <div className="field-group">
          <div className="field-label">
            <span className="env-indicator" style={{ background: "#d97706" }} />
            Staging URL
          </div>
          <input
            className="url-input"
            placeholder="https://elzonris_v1.teststl.com"
            value={stagingUrl}
            onChange={(e) => handleStagingChange(e.target.value)}
            onBlur={validateUrls}
            autoComplete="off"
            spellCheck="false"
            disabled={running}
          />
        </div>

        {/* ── Validation error ── */}
        {urlError && (
          <div className="url-error-msg">
            <div className="" role="alert">
              <span style={{ marginRight: 6 }}>⚠</span>
              {urlError}
            </div>
            <div style={{cursor:"pointer"}} onClick={handleFetchPages}>
              <span style={{ marginRight: 6, }}>⟳</span> Refetch
            </div>
          </div>
        )}

        {/* ── Fetch Pages button ── */}
        <button className="fetch-pages-btn" onClick={handleFetchPages} disabled={!canFetch || running}>
          {fetchState === "loading" ? (
            <>
              <span className="btn-mini-spinner" />
              Fetching pages…
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
                aria-hidden="true"
              >
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
            Matched site: <strong>{siteKey}</strong> &mdash;{" "}
            {pageList.length} page{pageList.length !== 1 ? "s" : ""} available
          </div>
        )}

        {/* ── Matched pages selector ── */}
        {fetchState === "done" && pageList.length > 0 && (
          <div className="field-group" style={{ marginTop: 20 }}>
            <div className="field-label" style={{ justifyContent: "space-between" }}>
              <span>Select Pages to Compare</span>
              <span className="page-sel-actions">
                <button className="text-action-btn" onClick={selectAll} disabled={running}>
                  Select all
                </button>
                <span className="text-action-sep">·</span>
                <button className="text-action-btn" onClick={clearAll} disabled={running}>
                  Clear
                </button>
              </span>
            </div>

            <div className="page-checkbox-list">
              {pageList.map((p) => {
                const checked = selectedPages.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`page-checkbox-item${checked ? " page-checkbox-item-checked" : ""}${running ? " page-checkbox-item-disabled" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePage(p.id)}
                      className="page-checkbox-input"
                      disabled={running}
                    />
                    <span className="page-checkbox-label">{p.label}</span>
                    <span className="page-checkbox-path">{p.path}</span>
                    {checked && <span className="page-checkbox-tick" aria-hidden="true">✓</span>}
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

        {/* ── Added / Deleted pages (info only — not selectable) ── */}
        {fetchState === "done" && (addedPages.length > 0 || deletedPages.length > 0) && (
          <div className="page-diff-section">
            <div className="page-diff-section-title">Page Changes Detected</div>

            {addedPages.map((p) => (
              <div key={p.path} className="page-diff-row page-diff-row-added">
                <span className="page-diff-badge page-diff-badge-added">Added</span>
                <span className="page-diff-label">{p.label}</span>
                <span className="page-diff-path">{p.path}</span>
              </div>
            ))}

            {deletedPages.map((p) => (
              <div key={p.path} className="page-diff-row page-diff-row-deleted">
                <span className="page-diff-badge page-diff-badge-deleted">Deleted</span>
                <span className="page-diff-label">{p.label}</span>
                <span className="page-diff-path">{p.path}</span>
              </div>
            ))}
          </div>
        )}

        <hr className="divider" />

        <div className="runComparison">
          {/* ── Resolution selector ── */}
          <div className="resolutionSel">
            <button
              type="button"
              className={`resButton${activeResolutionSelector === "desktop" ? " active" : ""}`}
              onClick={() => setActiveResolutionSelector("desktop")}
              aria-pressed={activeResolutionSelector === "desktop"}
              disabled={running}
            >
              <img className="resIcon" src={deskTopLogo} alt="Desktop View" />
            </button>
            <button
              type="button"
              className={`resButton${activeResolutionSelector === "mobile" ? " active" : ""}`}
              onClick={() => setActiveResolutionSelector("mobile")}
              aria-pressed={activeResolutionSelector === "mobile"}
              disabled={running}
            >
              <img className="resIcon" src={mobileLogo} alt="Mobile View" />
            </button>
            {/* ── Threshold input ── */}
          <div className="threshold-wrap">
            <input
              id="threshold-input"
              type="number"
              className="threshold-input"
              value={threshold}
              min={0.1}
              max={0.9}
              step={0.1}
              disabled={running}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v >= 0.1 && v <= 0.9) setThreshold(v);
              }}
            />           
          </div>
          </div>

          

          <button
            className="run-btn"
            disabled={!canRun}
            onClick={() => handleRun(activeResolutionSelector)}
          >
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
      </div>
    </>
  );
}
