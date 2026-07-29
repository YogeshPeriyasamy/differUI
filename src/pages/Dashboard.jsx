import React, { useState } from "react";
import { C } from "../constants/theme";
import { MOCK_RUNS } from "../constants/mockData";

export default function Dashboard({ onViewDiff }) {
  const [staging, setStaging] = useState("");
  const [live,    setLive]    = useState("");
  const [loading, setLoading] = useState(false);
  const [progress,setProgress]= useState(0);
  const [runs,    setRuns]    = useState(MOCK_RUNS);

  const runDiff = () => {
    if (!staging || !live) return;
    setLoading(true); setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random()*18 + 6;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        setTimeout(() => {
          setLoading(false);
          const r = { id:Date.now(), staging, live, status:"diff",
                      diffs:Math.floor(Math.random()*5)+1, time:"Just now" };
          setRuns(prev => [r, ...prev]);
          onViewDiff(r);
        }, 350);
      }
      setProgress(Math.min(Math.round(p), 100));
    }, 200);
  };

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="ld-spinner"/>
          <div className="ld-text">Capturing screenshots… {progress}%</div>
          <div className="prog-wrap"><div className="prog-fill" style={{width:`${progress}%`}}/></div>
        </div>
      )}

      <div style={{ marginBottom:24 }} className="fade-in">
        <div className="pg-title">Dashboard</div>
        <div className="pg-sub">Run visual regression checks between environments</div>
      </div>

      <div className="stat-grid">
        {[
          { label:"Total Runs",   val:"124", ch:"+12 this week",    cls:"ch-pos" },
          { label:"Diffs Found",  val:"38",  ch:"+5 this week",     cls:"ch-pos" },
          { label:"Pass Rate",    val:"69%", ch:"−3% vs last week", cls:"ch-neg" },
          { label:"Avg Diff Score",val:"2.4",ch:"regions / page",   cls:"ch-neu" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-lbl">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div className={`stat-ch ${s.cls}`}>{s.ch}</div>
          </div>
        ))}
      </div>

      {/* URL Input Panel */}
      <div className="url-panel">
        <div className="url-panel-title">New Comparison Run</div>
        <div className="url-panel-sub">Enter a staging and production URL to capture and compare screenshots</div>
        <div className="url-grid">
          <div>
            <div className="env-lbl">
              <span className="env-dot" style={{background:C.stagingDot}}/>
              Staging URL
            </div>
            <input className="vdt-inp" placeholder="https://staging.yourapp.com/page"
              value={staging} onChange={e=>setStaging(e.target.value)} />
          </div>
          <div>
            <div className="env-lbl">
              <span className="env-dot" style={{background:C.liveDot}}/>
              Live / Production URL
            </div>
            <input className="vdt-inp" placeholder="https://yourapp.com/page"
              value={live} onChange={e=>setLive(e.target.value)} />
          </div>
        </div>
        <div className="url-actions">
          <button className="vdt-btn-red" onClick={runDiff} disabled={!staging||!live}>
            ▶ Run Comparison
          </button>
          <button className="vdt-btn-out">Batch Import URLs</button>
          <button className="vdt-btn-out">Schedule Run</button>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="runs-card">
        <div className="runs-head">
          <span className="runs-head-title">Recent Runs</span>
          <button className="vdt-btn-out" style={{fontSize:"12px",padding:"6px 12px"}}>View all</button>
        </div>
        {runs.length === 0
          ? <div className="empty-st"><div className="empty-icon">◫</div><div className="empty-txt">No runs yet — enter URLs above to get started.</div></div>
          : runs.map(r => (
            <div className="run-row" key={r.id} onClick={()=>onViewDiff(r)}>
              <span className={`status-badge ${r.status==="pass"?"sb-pass":r.status==="diff"?"sb-diff":"sb-fail"}`}>
                {r.status==="pass" ? "✓ Pass" : r.status==="diff" ? "⚑ Diff" : "✗ Error"}
              </span>
              <div className="run-urls-wrap">
                <div className="run-url">{r.staging}</div>
                <div className="run-url run-url-live">↳ {r.live}</div>
              </div>
              <div className="run-meta">
                <div>{r.time}</div>
                {r.diffs>0 && <div className="run-diffs">{r.diffs} diffs</div>}
              </div>
            </div>
          ))
        }
      </div>
    </>
  );
}
