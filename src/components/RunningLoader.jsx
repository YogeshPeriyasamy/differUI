import React, { useMemo } from "react";

const sectionBasedCaptureSteps = [
  {
    threshold: 0,
    label: "Initialising",
    message: "Setting things up — this will only take a moment.",
  },
  {
    threshold: 20,
    label: "Capturing screenshots",
    message: "Visiting every page on both environments and taking section based screenshots.",
  },
  {
    threshold: 40,
    label: "Processing images",
    message: "Normalising dimensions and preparing images for pixel comparison.",
  },
  {
    threshold: 60,
    label: "Comparing differences",
    message: "Running pixel-level analysis and highlighting visual changes.",
  },
  {
    threshold: 80,
    label: "Building report",
    message: "Stitching the diff images together and assembling your results.",
  },
];

const fullPageBasedCaptureSteps = [
  {
    threshold: 0,
    label: "Initialising",
    message: "Setting things up — this will only take a moment.",
  },
  {
    threshold: 20,
    label: "Stabilizing Page",
    message: "Stabilizing the page before capturing screenshots.",
  },
  {
    threshold: 40,
    label: "Capturing screenshots",
    message: "Capturing the full-page screenshots.",
  },
  {
    threshold: 60,
    label: "Comparing differences",
    message: "Running pixel-level analysis and highlighting visual changes.",
  },
  {
    threshold: 80,
    label: "Building report",
    message: "Creating the final report with the comparison results.",
  },
];

export default function RunningLoader({ visible, phase = "Initialising", progress = 0, isFullPage = true }) {
  // Derive which step to display from the real progress value
  const stepIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < (isFullPage ? fullPageBasedCaptureSteps : sectionBasedCaptureSteps).length; i++) {
      if (progress >= (isFullPage ? fullPageBasedCaptureSteps : sectionBasedCaptureSteps)[i].threshold) idx = i;
    }
    return idx;
  }, [progress, isFullPage]);

  const current = (isFullPage ? fullPageBasedCaptureSteps : sectionBasedCaptureSteps)[stepIdx];

  if (!visible) return null;

  return (
    <div className="rl-backdrop" role="dialog" aria-modal="true" aria-label="Comparison in progress" aria-live="polite">
      <div className="rl-card">
        {/* ── Spinner ── */}
        <div className="rl-spinner-wrap">
          <svg className="rl-ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle className="rl-ring-track" cx="22" cy="22" r="18" />
            <circle className="rl-ring-fill" cx="22" cy="22" r="18" />
          </svg>
          <div className="rl-spinner-inner" aria-hidden="true" />
        </div>

        {/* ── Step heading — re-animates whenever stepIdx changes ── */}
        <div className="rl-step-label" key={`label-${stepIdx}`}>
          {current.label}
        </div>

        {/* ── Human-friendly sub-message ── */}
        <div className="rl-message" key={`msg-${stepIdx}`}>
          {current.message}
        </div>

        {/* ── Step dots ── */}
        <div className="rl-dots" aria-hidden="true">
          {(isFullPage ? fullPageBasedCaptureSteps : sectionBasedCaptureSteps).map((_, i) => (
            <span key={i} className={`rl-dot${i === stepIdx ? " rl-dot-active" : i < stepIdx ? " rl-dot-done" : ""}`} />
          ))}
        </div>

        {/* ── Progress bar — driven by real backend % ── */}
        <div className="rl-progress-track" aria-hidden="true">
          <div className="rl-progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>

        {/* ── Fine-print: raw backend phase + numeric % ── */}
        <div className="rl-phase-detail">
          {phase}&nbsp;&mdash;&nbsp;{progress}%
        </div>

        <div className="rl-please-wait">Please wait — do not close this tab</div>
      </div>
    </div>
  );
}
