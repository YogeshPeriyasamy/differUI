import React, { useState } from "react";
import { jsPDF } from "jspdf";

const API_BASE = "http://localhost:4000";

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
async function fetchImageAsDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
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

async function downloadPagePdf(pageName, liveUrl, diffUrl, stagingUrl) {
  const entries = [
    { label: "Live",    url: liveUrl,    color: [22, 163, 74]  },
    { label: "Diff",    url: diffUrl,    color: [192, 57, 43]  },
    { label: "Staging", url: stagingUrl, color: [217, 119, 6]  },
  ];

  const reports = [{text:`Validation report for ${pageName}`, fontSize: 14, fontStyle: 'bold', }];

  const images = await Promise.all(entries.map((e) => fetchImageAsDataUrl(e.url)));

  const MARGIN_PT  = 16;
  const TITLE_H    = 22;
  const LABEL_H    = 14;
  const LABEL_FONT = 9;
  const COL_GAP    = 8;
  const PAGE_W     = 841;
  const PAGE_H     = 595;

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(26, 26, 46);
  pdf.text(pageName, MARGIN_PT, MARGIN_PT + 10);

  const totalGap   = COL_GAP * 2;
  const colWidth   = (PAGE_W - MARGIN_PT * 2 - totalGap) / 3;
  const imgAreaTop = MARGIN_PT + TITLE_H + LABEL_H;
  const imgAreaH   = PAGE_H - imgAreaTop - MARGIN_PT;

  for (let i = 0; i < entries.length; i++) {
    const { label, color }           = entries[i];
    const { dataUrl, width, height } = images[i];
    const colX = MARGIN_PT + i * (colWidth + COL_GAP);

    pdf.setFillColor(...color);
    pdf.roundedRect(colX, MARGIN_PT + TITLE_H, colWidth, LABEL_H, 2, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(LABEL_FONT);
    pdf.setTextColor(255, 255, 255);
    pdf.text(label, colX + colWidth / 2, MARGIN_PT + TITLE_H + LABEL_H - 3.5, { align: "center" });

    const scaleW = colWidth / width;
    const scaleH = imgAreaH / height;
    const scale  = Math.min(scaleW, scaleH);
    const drawW  = width  * scale;
    const drawH  = height * scale;
    const offsetX = colX + (colWidth - drawW) / 2;

    const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    pdf.addImage(dataUrl, fmt, offsetX, imgAreaTop, drawW, drawH);
  }

  const safeFileName = pageName.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  pdf.save(`diff_${safeFileName}.pdf`);
}

// ---------------------------------------------------------------------------
// Mismatch badge colour — green < 5 %, amber < 20 %, red ≥ 20 %
// ---------------------------------------------------------------------------
function mismatchColor(pct) {
  if (pct < 5)  return { bg: "#dcfce7", color: "#15803d" };
  if (pct < 20) return { bg: "#fef3c7", color: "#b45309" };
  return           { bg: "#fee2e2", color: "#b91c1c" };
}

// ---------------------------------------------------------------------------
export default function ResultsPage({ result, onGoCompare }) {
  console.log("ResultsPage render", { result });
  
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [downloading,   setDownloading]   = useState(false);

  function imgUrl(relUrl) {
    return `${API_BASE}${relUrl}`;
  }

  const { runId, runDate, runTime, results = [] } = result ?? {};
  const activePage = results[activePageIdx] ?? null;

  async function handleDownloadPdf() {
    if (!activePage || downloading) return;
    setDownloading(true);
    try {
      await downloadPagePdf(
        activePage.page,
        imgUrl(activePage.liveUrl),
        imgUrl(activePage.diffUrl),
        imgUrl(activePage.stagingUrl),
      );
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
                <span
                  className="page-tab-mismatch"
                  style={{ background: mc.bg, color: mc.color }}
                >
                  {r.avgMismatchPct ?? 0}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activePage && (
        <div
          className="result-card"
          style={{ borderTopLeftRadius: results.length > 1 ? 0 : undefined }}
        >
          {/* ── Card header ──────────────────────────────────────────────── */}
          <div className="result-header">
            <div className="result-header-left">
              <div className="result-title">{activePage.page}</div>

              {/* URL pair */}
              <div className="result-url-pair">
                <span className="result-url-tag result-url-tag-live">Live</span>
                <a
                  href={activePage.livePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-url-link"
                >
                  {activePage.livePageUrl}
                </a>
              </div>
              <div className="result-url-pair">
                <span className="result-url-tag result-url-tag-staging">Staging</span>
                <a
                  href={activePage.stagingPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-url-link"
                >
                  {activePage.stagingPageUrl}
                </a>
              </div>

              {/* Section stats row */}
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

            <div className="result-header-right">
              {/* Mismatch percentage badge */}
              {activePage.avgMismatchPct !== undefined && (() => {
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
                      width="15" height="15"
                      viewBox="0 0 24 24"
                      fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
