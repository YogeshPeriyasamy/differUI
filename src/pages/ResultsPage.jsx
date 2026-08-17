import React from "react";
import { jsPDF } from "jspdf";

export default function ResultsPage({ result, onGoCompare }) {
  const downloadDiffPDF = async () => {
    const imageUrl = `http://localhost:3000${result.diffUrl}`;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgRatio = img.width / img.height;
      const pageRatio = pageWidth / pageHeight;

      let imgWidth;
      let imgHeight;

      if (imgRatio > pageRatio) {
        // Image is wider
        imgWidth = pageWidth;
        imgHeight = pageWidth / imgRatio;
      } else {
        // Image is taller
        imgHeight = pageHeight;
        imgWidth = pageHeight * imgRatio;
      }

      pdf.addImage(img, "PNG", (pageWidth - imgWidth) / 2, 0, imgWidth, imgHeight);

      pdf.save("diff-result.pdf");
    };

    img.src = imageUrl;
  };

  if (!result) {
    return (
      <div className="fade-in">
        <div className="result-card">
          <div className="empty-results">
            <div className="empty-icon">◫</div>
            <div className="empty-text">No results yet</div>
            <div className="empty-sub">Run a comparison first to see the diff here</div>
            <button
              onClick={onGoCompare}
              style={{
                marginTop: 8,
                padding: "9px 20px",
                background: "#c0392b",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              Go to Compare →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="result-card">
        {/* Header */}
        <div className="result-header">
          <div className="result-header-left">
            <div className="result-title">Diff Result</div>
            <div className="result-urls">
              <span style={{ color: "#d97706" }}>●</span>
              <span>{result.staging}</span>
              <span style={{ color: "#b8c0cc" }}>vs</span>
              <span style={{ color: "#16a34a" }}>●</span>
              <span>{result.live}</span>
            </div>
          </div>
          <button
            onClick={downloadDiffPDF}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Download PDF ↓
          </button>
        </div>

        <div className="diff-side-grid">
          <div className="diff-col">
            <div className="diff-col-header">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", display: "inline-block" }} />
              Staging
            </div>
            <img src={`http://localhost:3000${result.stagingUrl}`} className="diff-img" alt="Staging screenshot" />
          </div>
          <div className="diff-col">
            <div className="diff-col-header">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b", display: "inline-block" }} />
              Diff
            </div>
            <img src={`http://localhost:3000${result.diffUrl}`} className="diff-img" alt="Diff screenshot" />
          </div>
          <div className="diff-col">
            <div className="diff-col-header">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Live / Production
            </div>
            <img src={`http://localhost:3000${result.liveUrl}`} className="diff-img" alt="Live screenshot" />
          </div>
        </div>
      </div>
    </div>
  );
}
