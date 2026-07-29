import React, { useState, useRef, useEffect } from "react";
import { C } from "../constants/theme";
import { MOCK_CHANGES, IMG_STAGING, IMG_LIVE } from "../constants/mockData";

export default function DiffPage({ run, onBack }) {
  const [mode, setMode] = useState("side");
  const [sliderPct, setSliderPct] = useState(50);
  const wrapRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current || !wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setSliderPct(Math.max(0, Math.min(100, Math.round(((e.clientX - r.left) / r.width) * 100))));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  const sUrl = run?.staging || "https://staging.acme.io/home";
  const lUrl = run?.live    || "https://acme.io/home";

  return (
    <div className="fade-in">
      <div className="diff-topbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="pg-title" style={{ fontSize: 20 }}>Visual Diff Report</div>
      </div>

      <div className="url-chips">
        <div className="url-chip"><span className="env-dot" style={{ background: C.stagingDot }}/>{sUrl}</div>
        <div style={{ fontSize: 12, color: C.textLight, alignSelf: "center" }}>vs</div>
        <div className="url-chip"><span className="env-dot" style={{ background: C.liveDot }}/>{lUrl}</div>
      </div>

      <div className="summary-bar">
        {[
          { color: C.diffAmber,  label: "4 differences found" },
          { color: C.diffRed,    label: "1 missing element" },
          { color: C.diffPurple, label: "2 layout changes" },
          { color: C.liveDot,    label: "1 content change" },
        ].map(c => (
          <div className="sum-chip" key={c.label}>
            <span className="chip-dot" style={{ background: c.color }}/>{c.label}
          </div>
        ))}
      </div>

      <div className="view-toggle">
        {[{ id: "side", label: "Side by Side" }, { id: "slider", label: "Slider" }, { id: "overlay", label: "Overlay" }].map(v => (
          <button key={v.id} className={`vt-btn ${mode === v.id ? "active" : ""}`} onClick={() => setMode(v.id)}>{v.label}</button>
        ))}
      </div>

      {/* ── Side by Side ── */}
      {mode === "side" && (
        <div className="diff-grid">
          {[
            { label: "Staging", dot: C.stagingDot, img: IMG_STAGING, showHl: true },
            { label: "Live / Production", dot: C.liveDot, img: IMG_LIVE, showHl: false },
          ].map(col => (
            <div className="diff-col" key={col.label}>
              <div className="diff-col-hd">
                <span className="env-dot" style={{ background: col.dot }}/>{col.label}
              </div>
              <div className="diff-frame">
                <img src={col.img} className="diff-img" alt={col.label}/>
                {col.showHl && (
                  <div className="diff-overlay-layer">
                    <div className="diff-hl" style={{ top: "14%", left: "3%", width: "94%", height: "7%" }}/>
                    <div className="diff-hl" style={{ top: "34%", left: "36%", width: "28%", height: "8%" }}/>
                    <div className="diff-hl" style={{ top: "0%", left: "0%", width: "100%", height: "14%" }}/>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Slider ── */}
      {mode === "slider" && (
        <div className="slider-wrap" ref={wrapRef} onMouseDown={() => { dragging.current = true; }}>
          <img src={IMG_LIVE} style={{ width: "100%", height: 460, objectFit: "cover", objectPosition: "top", display: "block" }} alt="Live"/>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${sliderPct}%`, overflow: "hidden" }}>
            <img src={IMG_STAGING} style={{ width: wrapRef.current?.offsetWidth || 800, height: 460, objectFit: "cover", objectPosition: "top" }} alt="Staging"/>
          </div>
          <div className="sl-handle" style={{ left: `calc(${sliderPct}% - 1.5px)` }}>
            <div className="sl-knob">⇔</div>
          </div>
          <span className="slider-lbl" style={{ left: 12, color: C.stagingDot }}>Staging</span>
          <span className="slider-lbl" style={{ right: 12, color: C.liveDot }}>Live</span>
        </div>
      )}

      {/* ── Overlay ── */}
      {mode === "overlay" && (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <img src={IMG_LIVE} style={{ width: "100%", height: 460, objectFit: "cover", objectPosition: "top", display: "block" }} alt="Live"/>
          <img src={IMG_STAGING} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 460, objectFit: "cover", objectPosition: "top", mixBlendMode: "difference", opacity: .8 }} alt="Staging overlay"/>
          <span style={{ position: "absolute", top: 12, left: 14, fontSize: 11, fontWeight: 600,
            background: "rgba(255,255,255,.85)", padding: "3px 10px", borderRadius: 20,
            border: `1px solid ${C.border}`, color: C.textMid }}>Difference blend</span>
        </div>
      )}

      {/* ── Changes list ── */}
      <div className="changes-card">
        <div className="changes-hd">Detected Changes</div>
        {MOCK_CHANGES.map((c, i) => (
          <div className="change-row" key={i}>
            <span className={`ctype ${c.badge}`}>{c.label}</span>
            <div>
              <div className="ch-desc">{c.desc}</div>
              <div className="ch-detail">{c.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
