import React, { useState } from "react";
import { SITES } from "../constants/sites";

export default function ComparePage({ onRun }) {
  const [siteId,         setSiteId]         = useState(SITES[0]?.id ?? "");
  const [selectedPages,  setSelectedPages]  = useState([]);

  const site      = SITES.find((s) => s.id === siteId) ?? null;
  const pageList  = site?.pages ?? [];
  const canRun    = siteId && selectedPages.length > 0;

  function togglePage(pageId) {
    setSelectedPages((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId],
    );
  }

  function selectAll() {
    setSelectedPages(pageList.map((p) => p.id));
  }

  function clearAll() {
    setSelectedPages([]);
  }

  function handleSiteChange(id) {
    setSiteId(id);
    setSelectedPages([]);
  }

  return (
    <div className="fade-in">
      <div className="compare-card">
        <div className="compare-title">New Comparison</div>
        <div className="compare-sub">
          Select a site and the pages you want to capture and compare
        </div>

        {/* ── Site selector ── */}
        <div className="field-group">
          <div className="field-label">Site</div>
          <div className="site-selector-grid">
            {SITES.map((s) => (
              <button
                key={s.id}
                className={`site-btn${siteId === s.id ? " site-btn-active" : ""}`}
                onClick={() => handleSiteChange(s.id)}
              >
                <span className="site-btn-dot" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Page selector ── */}
        {site && (
          <div className="field-group">
            <div className="field-label" style={{ justifyContent: "space-between" }}>
              <span>Pages</span>
              <span className="page-sel-actions">
                <button className="text-action-btn" onClick={selectAll}>
                  Select all
                </button>
                <span className="text-action-sep">·</span>
                <button className="text-action-btn" onClick={clearAll}>
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
                    className={`page-checkbox-item${checked ? " page-checkbox-item-checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePage(p.id)}
                      className="page-checkbox-input"
                    />
                    <span className="page-checkbox-label">{p.label}</span>
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

        <button
          className="run-btn"
          disabled={!canRun}
          onClick={() => onRun(siteId, selectedPages)}
        >
          ▶ Run Comparison
        </button>
      </div>
    </div>
  );
}
