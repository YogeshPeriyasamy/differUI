import React, { useState } from "react";

const MODES = [
  {
    id: "full",
    icon: "🖼",
    title: "Full Page Screenshot",
    desc: "Captures the entire page layout in a single screenshot for a quick, high-level comparison.",
  },
  {
    id: "section",
    icon: "▦",
    title: "Section by Section",
    desc: "Breaks the page into components (Navbar, Hero, Features, Footer) for focused, granular comparison.",
  },
];

export default function ComparePage({ onRun }) {
  const [staging, setStaging] = useState("");
  const [live,    setLive]    = useState("");
  const [mode,    setMode]    = useState("full");

  const canRun = staging.trim() !== "" && live.trim() !== "";

  const runComparison = () => {
    if (canRun) onRun(staging.trim(), live.trim(), mode);
  };

  return (
    <div className="fade-in">
      <div className="compare-card">
        <div className="compare-title">New Comparison</div>
        <div className="compare-sub">Enter the staging and live URLs to capture and compare screenshots</div>

        <div className="field-group">
          <div className="field-label">
            <span className="env-indicator" style={{ background: "#16a34a" }} />
            Live / Production URL
          </div>
          <input
            className="url-input"
            placeholder="https://yourapp.com/page"
            value={live}
            onChange={e => setLive(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runComparison()}
          />
        </div>

        <div className="field-group">
          <div className="field-label">
            <span className="env-indicator" style={{ background: "#d97706" }} />
            Staging URL
          </div>
          <input
            className="url-input"
            placeholder="https://staging.yourapp.com/page"
            value={staging}
            onChange={e => setStaging(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runComparison()}
          />
        </div>

        {/* ── Screenshot Mode Selector ── */}
        <div className="mode-selector-wrap">
          <div className="mode-selector-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Capture Mode
          </div>
          <div className="mode-selector-grid">
            {MODES.map(m => (
              <div
                key={m.id}
                className={`mode-card${mode === m.id ? " mode-card-active" : ""}`}
                onClick={() => setMode(m.id)}
                id={`mode-card-${m.id}`}
              >
                <div className="mode-card-radio">
                  <div className="mode-card-radio-dot" />
                </div>
                <div className="mode-card-icon">{m.icon}</div>
                <div className="mode-card-title">{m.title}</div>
                <div className="mode-card-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider" />

        <button
          className="run-btn"
          disabled={!canRun}
          onClick={runComparison}
        >
          ▶ Run Comparison
        </button>
      </div>
    </div>
  );
}
