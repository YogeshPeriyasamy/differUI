import React, { useState } from "react";

const API_BASE = "http://localhost:4000";

export default function ResultsPage({ result, onGoCompare }) {
  const [activePageIdx, setActivePageIdx] = useState(0);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="fade-in">
        <div className="result-card">
          <div className="empty-results">
            <div className="empty-icon">◫</div>
            <div className="empty-text">No results yet</div>
            <div className="empty-sub">Run a comparison first to see the diff here</div>
            <button className="run-btn" style={{ marginTop: 8 }} onClick={onGoCompare}>
              Go to Compare →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { runId, results = [] } = result;
  const activePage = results[activePageIdx] ?? null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function imgUrl(relUrl) {
    return `${API_BASE}${relUrl}`;
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">

      {/* Run meta bar */}
      <div className="run-meta-bar">
        <div className="run-meta-label">Run ID</div>
        <code className="run-meta-id">{runId}</code>
        <div className="run-meta-count">
          {results.length} page{results.length !== 1 ? "s" : ""} compared
        </div>
      </div>

      {/* Page tabs (if more than one page) */}
      {results.length > 1 && (
        <div className="page-tab-bar">
          {results.map((r, i) => (
            <button
              key={r.page}
              className={`page-tab-btn${activePageIdx === i ? " page-tab-btn-active" : ""}`}
              onClick={() => setActivePageIdx(i)}
            >
              {r.page}
              <span className="page-tab-count">
                {r.sectionCount.matched}/{r.sectionCount.defined}
              </span>
            </button>
          ))}
        </div>
      )}

      {activePage && (
        <div className="result-card" style={{ marginTop: results.length > 1 ? 0 : 0, borderTopLeftRadius: results.length > 1 ? 0 : undefined }}>

          {/* Header */}
          <div className="result-header">
            <div className="result-header-left">
              <div className="result-title">{activePage.page}</div>
              <div className="result-section-stats">
                <span className="stat-pill stat-pill-green">
                  {activePage.sectionCount.matched} matched
                </span>
                {activePage.sectionCount.missingInStaging > 0 && (
                  <span className="stat-pill stat-pill-amber">
                    {activePage.sectionCount.missingInStaging} missing in staging
                  </span>
                )}
                <span className="stat-pill stat-pill-grey">
                  {activePage.sectionCount.defined} defined
                </span>
              </div>
            </div>
          </div>

          {/* 3-column diff view */}
          <div className="diff-side-grid">
            <div className="diff-col">
              <div className="diff-col-header">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                Live
              </div>
              <img
                src={imgUrl(activePage.liveUrl)}
                className="diff-img"
                alt="Live screenshot"
                loading="lazy"
              />
            </div>

            <div className="diff-col">
              <div className="diff-col-header">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", display: "inline-block" }} />
                Diff
              </div>
              <img
                src={imgUrl(activePage.diffUrl)}
                className="diff-img"
                alt="Diff screenshot"
                loading="lazy"
              />
            </div>

            <div className="diff-col">
              <div className="diff-col-header">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", display: "inline-block" }} />
                Staging
              </div>
              <img
                src={imgUrl(activePage.stagingUrl)}
                className="diff-img"
                alt="Staging screenshot"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
