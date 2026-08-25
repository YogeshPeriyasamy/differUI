import React, { useState, useEffect } from "react";

// Cycling status steps shown during a comparison run
const STEPS = [
  { label: "Initialising",      message: "Setting up the comparison environment…"  },
  { label: "Capturing Live",    message: "Taking screenshots of the live site…"     },
  { label: "Capturing Staging", message: "Taking screenshots of the staging site…"  },
  { label: "Comparing",         message: "Analysing pixel differences…"             },
  { label: "Building Report",   message: "Almost there — preparing your results…"   },
];

const STEP_DURATION = 2000; // ms per step

export default function RunningLoader({ visible }) {
  const [stepIdx, setStepIdx] = useState(0);

  // Cycle through steps while visible
  useEffect(() => {
    if (!visible) {
      setStepIdx(0);
      return;
    }
    const id = setInterval(() => {
      setStepIdx((prev) => (prev + 1 < STEPS.length ? prev + 1 : prev));
    }, STEP_DURATION);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const progress = Math.round(((stepIdx + 1) / STEPS.length) * 100);

  return (
    <div className="rl-backdrop" role="dialog" aria-modal="true" aria-label="Comparison in progress">

      <div className="rl-card">

        {/* ── Spinner ── */}
        <div className="rl-spinner-wrap">
          <svg className="rl-ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle className="rl-ring-track" cx="22" cy="22" r="18" />
            <circle className="rl-ring-fill"  cx="22" cy="22" r="18" />
          </svg>
          <div className="rl-spinner-inner" aria-hidden="true" />
        </div>

        {/* ── Step label ── */}
        <div className="rl-step-label" key={stepIdx}>
          {STEPS[stepIdx].label}
        </div>

        {/* ── Sub-message ── */}
        <div className="rl-message" key={`msg-${stepIdx}`}>
          {STEPS[stepIdx].message}
        </div>

        {/* ── Step dots ── */}
        <div className="rl-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`rl-dot${i === stepIdx ? " rl-dot-active" : i < stepIdx ? " rl-dot-done" : ""}`}
            />
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div className="rl-progress-track" aria-hidden="true">
          <div className="rl-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="rl-please-wait">Please wait — do not close this tab</div>
      </div>
    </div>
  );
}
