import { jsPDF } from "jspdf";
import { fetchImageAsDataUrl } from "../services/api";

export async function downloadPagePdf(activePage, runId, runDate, runTime) {
  const { page: pageName, liveUrl, diffUrl, stagingUrl, livePageUrl, stagingPageUrl, avgMismatchPct = 0 } = activePage;

  const entries = [
    { label: "Live", url: liveUrl, color: [65, 65, 65] },
    { label: "Comparison Analysis", url: diffUrl, color: [255, 0, 0] },
    { label: "Staging", url: stagingUrl, color: [65, 65, 65] },
  ];

  const reports = [
    { text: `Validation report for "${pageName}" page`, fontSize: 14, fontStyle: "bold", fontColor: "#000000" },
    { text: `Comparison : ${livePageUrl} (vs) ${stagingPageUrl}`, fontSize: 12, fontStyle: "normal", fontColor: "#333333" },
    { text: `Run ID: ${runId}`, fontSize: 10, fontStyle: "normal", fontColor: "#333333" },
    { text: `Run: ${runDate} : ${runTime}`, fontSize: 10, fontStyle: "normal", fontColor: "#333333" },
  ];

  // Fetch all three images in parallel
  const images = await Promise.all(
    entries.map(({ label, url }) =>
      fetchImageAsDataUrl(url).catch((err) => {
        console.error(`Failed to load image for ${label}:`, err);
        throw err;
      }),
    ),
  );

  // ── PDF setup ────────────────────────────────────────────────────────────
  const margin = 10;
  const labelHeight = 14;
  const labelFontSz = 9;
  const colGap = 2;
  const badgeW = 80;
  const badgeH = 18;
  const a4LandscapeWidth = 841.89;

  let headerY = margin;
  for (const rep of reports) {
    headerY += rep.fontSize + 2;
  }
  headerY += badgeH + 4; // Add space for the badge
  const headerHeight = headerY + labelHeight; // Total height of the header section
  // const colWidth = (pageWidth - margin * 2 - colGap * 2) / 3;
  const colWidth = (a4LandscapeWidth - margin * 2 - colGap * 2) / 3;
  const renderedHeights = images.map(({ width, height }) => height * Math.min(colWidth / Math.max(width, 1), 1));
  const maxImageHeight = Math.max(...renderedHeights);
  const totalHeight = headerHeight + maxImageHeight + margin; // Total height of the PDF content

  const pdf = new jsPDF({ unit: "px", format: [a4LandscapeWidth, totalHeight] });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = margin;

  // ── Report header text ───────────────────────────────────────────────────
  for (const rep of reports) {
    const hex = rep.fontColor.replace("#", "");
    pdf.setFont("helvetica", rep.fontStyle);
    pdf.setFontSize(rep.fontSize);
    pdf.setTextColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    pdf.text(rep.text, margin, y);
    y += rep.fontSize + 2;
  }

  // ── Mismatch badge ────────────────────────────────────────────────────────
  const mismatchRgb = avgMismatchPct <= 5 ? [34, 197, 94] : avgMismatchPct <= 10 ? [249, 115, 22] : [239, 68, 68];

  const badgeX = pageWidth - margin - badgeW;

  pdf.setFillColor(...mismatchRgb);
  pdf.roundedRect(badgeX, y, badgeW, badgeH, 5, 5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Mismatch: ${avgMismatchPct}%`, badgeX + badgeW / 2, y + 12, { align: "center" });

  y += badgeH + 4;

  // ── Image columns ─────────────────────────────────────────────────────────
  const imgAreaTop = y + labelHeight;
  for (let i = 0; i < entries.length; i++) {
    const { label, color } = entries[i];
    const { dataUrl, width, height } = images[i];
    const colX = margin + i * (colWidth + colGap);

    // draw column label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(labelFontSz);
    pdf.setTextColor(...color);
    pdf.text(label, colX, y + labelHeight - 3.5, { align: "left" });

    // draw image
    const scale = Math.min(colWidth / Math.max(width, 1), 1);
    const drawW = width * scale;
    const drawH = height * scale;
    const offsetX = colX + (colWidth - drawW) / 2;
    const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

    pdf.addImage(dataUrl, fmt, offsetX, imgAreaTop, drawW, drawH);
  }

  const safeFileName = pageName.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  pdf.save(`diff_${safeFileName}.pdf`);
}
