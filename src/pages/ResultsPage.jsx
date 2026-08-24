import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { API_BASE } from "../constants/api";

function resolveImageUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_BASE}${url}`;
  }
  return `${API_BASE}/${url.replace(/^\.?\//, "")}`;
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
async function fetchImageAsDataUrl(url) {
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

async function downloadPagePdf(activePage, runId, runDate, runTime) {
  const pageName = activePage.page;
  const liveUrl = activePage.liveUrl;
  const diffUrl = activePage.diffUrl;
  const stagingUrl = activePage.stagingUrl;

  const livePageUrl = activePage.livePageUrl;
  const stagingPageUrl = activePage.stagingPageUrl;

  const mismatch = activePage.avgMismatchPct ?? 0;

  const entries = [
    {
      label: "Live",
      url: liveUrl,
      color: [65,65,65],
    },
    {
      label: "Difference",
      url: diffUrl,
      color: [255,0,0],
    },
    {
      label: "Staging",
      url: stagingUrl,
      color: [65,65,65],
    },
  ];

  // --------------------------------------------------
  // Report information
  // --------------------------------------------------

  const reports = [
    {
      text: `Validation report for "${pageName}" page`,
      fontSize: 14,
      fontStyle: "bold",
      fontColor: "#000000",
    },
    {
      text: `Comparison : ${livePageUrl} (vs) ${stagingPageUrl}`,
      fontSize: 12,
      fontStyle: "normal",
      fontColor: "#333333",
    },
    {
      text: `Run ID: ${runId}`,
      fontSize: 10,
      fontStyle: "normal",
      fontColor: "#333333",
    },
    {
      text: `Run: ${runDate} : ${runTime}`,
      fontSize: 10,
      fontStyle: "normal",
      fontColor: "#333333",
    },
  ];

  // --------------------------------------------------
  // Fetch images
  // --------------------------------------------------

  // const images = await Promise.all(entries.map((entry) => fetchImageAsDataUrl(entry.url)));
  const images = await Promise.all(
  entries.map(async (entry) => {
    try {    
      const result = await fetchImageAsDataUrl(entry.url);
      // console.log(`Loaded ${entry.label} successfully`);
      return result;
    } catch (error) {
      console.error(`FAILED: ${entry.label}`);
      console.error("Error:", error);
      throw error;
    }
  })
);

  // --------------------------------------------------
  // PDF setup
  // --------------------------------------------------

  const margin = 10;
  const labelHeight = 14;
  const labelFontSize = 9;
  const colGap = 2;

  const x = 10;
  let y = 10;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // --------------------------------------------------
  // Draw report information
  // --------------------------------------------------

  for (const rep of reports) {
    const hex = rep.fontColor.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    pdf.setFont("helvetica", rep.fontStyle);
    pdf.setFontSize(rep.fontSize);
    pdf.setTextColor(r, g, b);
    pdf.text(rep.text, x, y);

    // Move down for next line
    y += rep.fontSize + 2;
  }

  // --------------------------------------------------
  // Mismatch badge
  // --------------------------------------------------

  let mismatchColor;

  if (mismatch <= 5) {
    // Green: 0% - 5%
    mismatchColor = [34, 197, 94];
  } else if (mismatch <= 10) {
    // Orange: >5% - 10%
    mismatchColor = [249, 115, 22];
  } else {
    // Red: >10%
    mismatchColor = [239, 68, 68];
  }

  const badgeWidth = 80;
  const badgeHeight = 18;

  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = y;

  // Badge background
  pdf.setFillColor(...mismatchColor);

  pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 5, 5, "F");

  // Badge text
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);

  pdf.text(`Mismatch: ${mismatch}%`, badgeX + badgeWidth / 2, badgeY+12 , {
    align: "center",
  });

  // Move below mismatch badge
  y = badgeY + badgeHeight + 4;

  // --------------------------------------------------
  // Calculate image columns
  // --------------------------------------------------

  const labelY = y;
  const totalGap = colGap * 2;
  const colWidth = (pageWidth - margin * 2 - totalGap) / 3;
  const imgAreaTop = labelY + labelHeight;
  const imgAreaH = pageHeight - imgAreaTop - margin;

  // --------------------------------------------------
  // Draw Live / Diff / Staging
  // --------------------------------------------------

  for (let i = 0; i < entries.length; i++) {
    const { label, color } = entries[i];

    const { dataUrl, width, height } = images[i];

    const colX = margin + i * (colWidth + colGap);

    // pdf.roundedRect(colX, labelY, colWidth, labelHeight, 2, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(labelFontSize);
    pdf.setTextColor(...color);

    pdf.text(label, colX , labelY + labelHeight - 3.5, {
      align: "left",
    });

    // ----------------------------------------------
    // Image scaling
    // ----------------------------------------------

    const scaleW = colWidth / Math.max(width, 1);
    const scaleH = imgAreaH / Math.max(height, 1);
    const scale = Math.min(scaleW, scaleH, 1);

    const drawW = width * scale;
    const drawH = height * scale;

    // Keep the image in its own column and avoid cropping.
    const offsetX = colX + (colWidth - drawW) / 2;

    // ----------------------------------------------
    // Add image
    // ----------------------------------------------

    const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

    pdf.addImage(dataUrl, fmt, offsetX, imgAreaTop, drawW, drawH);
  }

  // --------------------------------------------------
  // Save PDF
  // --------------------------------------------------

  const safeFileName = pageName.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();

  pdf.save(`diff_${safeFileName}.pdf`);
}

// ---------------------------------------------------------------------------
// Mismatch badge colour — green < 5 %, amber < 20 %, red ≥ 20 %
// ---------------------------------------------------------------------------
function mismatchColor(pct) {
  if (pct < 5) return { bg: "#dcfce7", color: "#15803d" };
  if (pct < 20) return { bg: "#fef3c7", color: "#b45309" };
  return { bg: "#fee2e2", color: "#b91c1c" };
}

// ---------------------------------------------------------------------------
export default function ResultsPage({ result, onGoCompare }) {
  console.log("ResultsPage render", { result });

  const [activePageIdx, setActivePageIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  function imgUrl(relUrl) {
    return resolveImageUrl(relUrl);
  }

  const { runId, runDate, runTime, results = [] } = result ?? {};
  const activePage = results[activePageIdx] ?? null;

  async function handleDownloadPdf() {
    if (!activePage || downloading) return;
    setDownloading(true);
    try {
      await downloadPagePdf(activePage, runId, runDate, runTime);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. Check the console for details.");
    } finally {
      setDownloading(false);
    }
  }

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

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {/* ── Run meta bar ─────────────────────────────────────────────────── */}
      <div className="run-meta-bar">
        <div className="run-meta-item">
          <span className="run-meta-label">Run ID</span>
          <code className="run-meta-id">{runId}</code>
        </div>
        {runDate && (
          <div className="run-meta-item">
            <span className="run-meta-label">Date</span>
            <span className="run-meta-value">{runDate}</span>
          </div>
        )}
        {runTime && (
          <div className="run-meta-item">
            <span className="run-meta-label">Time</span>
            <span className="run-meta-value">{runTime}</span>
          </div>
        )}
        <div className="run-meta-item">
          <span className="run-meta-label">Pages</span>
          <span className="run-meta-value">
            {results.length} page{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Page tabs ────────────────────────────────────────────────────── */}
      {results.length > 1 && (
        <div className="page-tab-bar">
          {results.map((r, i) => {
            const mc = mismatchColor(r.avgMismatchPct ?? 0);
            return (
              <button
                key={r.page}
                className={`page-tab-btn${activePageIdx === i ? " page-tab-btn-active" : ""}`}
                onClick={() => setActivePageIdx(i)}
              >
                {r.page}
                <span className="page-tab-mismatch" style={{ background: mc.bg, color: mc.color }}>
                  {r.avgMismatchPct ?? 0}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activePage && (
        <div className="result-card" style={{ borderTopLeftRadius: results.length > 1 ? 0 : undefined }}>
          {/* ── Card header ──────────────────────────────────────────────── */}
          <div className="result-header">
            <div className="result-header-left">
              <div className="result-title">{activePage.page}</div>

              {/* URL pair */}
              <div className="result-url-pair">
                <span className="result-url-tag result-url-tag-live">Live</span>
                <a href={activePage.livePageUrl} target="_blank" rel="noopener noreferrer" className="result-url-link">
                  {activePage.livePageUrl}
                </a>
              </div>
              <div className="result-url-pair">
                <span className="result-url-tag result-url-tag-staging">Staging</span>
                <a href={activePage.stagingPageUrl} target="_blank" rel="noopener noreferrer" className="result-url-link">
                  {activePage.stagingPageUrl}
                </a>
              </div>

              {/* Section stats row */}
              <div className="result-section-stats">
                <span className="stat-pill stat-pill-green">{activePage.sectionCount.matched} matched</span>
                {activePage.sectionCount.missingInStaging > 0 && (
                  <span className="stat-pill stat-pill-amber">{activePage.sectionCount.missingInStaging} missing in staging</span>
                )}
                <span className="stat-pill stat-pill-grey">{activePage.sectionCount.defined} defined</span>
              </div>
            </div>

            <div className="result-header-right">
              {/* Mismatch percentage badge */}
              {activePage.avgMismatchPct !== undefined &&
                (() => {
                  const mc = mismatchColor(activePage.avgMismatchPct);
                  return (
                    <div
                      className="mismatch-badge"
                      style={{ background: mc.bg, color: mc.color }}
                      title="Average mismatch percentage across all captured sections"
                    >
                      <span className="mismatch-badge-value">{activePage.avgMismatchPct}%</span>
                      <span className="mismatch-badge-label">mismatch</span>
                    </div>
                  );
                })()}

              {/* PDF download */}
              <button
                className="pdf-download-btn"
                onClick={handleDownloadPdf}
                disabled={downloading}
                title="Download PDF (Live · Diff · Staging)"
                aria-label="Download page diff as PDF"
              >
                {downloading ? (
                  <>
                    <span className="pdf-btn-spinner" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── 3-column diff view ────────────────────────────────────────── */}
          <div className="diff-side-grid">
            <div className="diff-col">
              <div className="diff-col-header">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                Live
              </div>
              <img src={imgUrl(activePage.liveUrl)} className="diff-img" alt="Live screenshot" loading="lazy" />
            </div>

            <div className="diff-col">
              <div className="diff-col-header">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", display: "inline-block" }} />
                Diff
              </div>
              <img src={imgUrl(activePage.diffUrl)} className="diff-img" alt="Diff screenshot" loading="lazy" />
            </div>

            <div className="diff-col">
              <div className="diff-col-header">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", display: "inline-block" }} />
                Staging
              </div>
              <img src={imgUrl(activePage.stagingUrl)} className="diff-img" alt="Staging screenshot" loading="lazy" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
