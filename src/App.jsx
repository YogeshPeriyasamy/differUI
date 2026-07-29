import React, { useState, useCallback } from "react";
import LoginPage from "./pages/LoginPage";
import ComparePage from "./pages/ComparePage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem("vdt_user") || "");
  const [tab, setTab] = useState("compare");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // const [progress, setProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogin = (email) => {
    setUser(email);
    localStorage.setItem("vdt_user", email);
  };

  const handleLogout = () => {
    setUser("");
    localStorage.removeItem("vdt_user");
  };

  const getInitials = (email) => {
    if (!email) return "JD";
    const namePart = email.split("@")[0];
    const parts = namePart.split(/[._-]/);
    if (parts.length > 1 && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return namePart.slice(0, 2).toUpperCase();
  };

  const handleRun = useCallback(async (liveUrl, stagedUrl) => {
    setLoading(true);
    try {
      const res = await fetch("https://visualdiffer-6.onrender.com/compare-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveUrl, stagedUrl }),
      });
      if (!res.ok) throw new Error("Failed to compare URLs");
      const data = await res.json();
      setResult({
        staging: stagedUrl,
        live: liveUrl,
        diffs: data.diffs ?? 1,
        liveUrl: data.liveUrl,
        stagingUrl: data.stagingUrl,
        diffUrl: data.diffUrl,
      });
      setTab("results");
    } catch (err) {
      console.error(err);
      alert("Error comparing URLs. Please try again.");
    } finally {
      setLoading(false);
    }

  }, []);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-root">
      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />         
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-logo-wrap">
          <div className="sidebar-logo">V</div>
          <div>
            <div className="sidebar-brand-text">VisualDiff</div>
            <div className="sidebar-brand-sub">Regression Tool</div>
          </div>
        </div>

        <div className="sidebar-nav-section">Main</div>
        <div
          className={`sidebar-icon ${tab === "compare" ? "active" : ""}`}
          onClick={() => {
            setTab("compare");
            setSidebarOpen(false);
          }}
        >
          <span className="sidebar-icon-emoji">⊞</span>
          <span className="sidebar-icon-label">Compare</span>
        </div>
        <div
          className={`sidebar-icon ${tab === "results" ? "active" : ""}`}
          onClick={() => {
            setTab("results");
            setSidebarOpen(false);
          }}
        >
          <span className="sidebar-icon-emoji">◫</span>
          <span className="sidebar-icon-label">Results</span>
        </div>
      </aside>

      {/* Main panel */}
      <div className="main-panel">
        {/* Top bar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle menu">
              ☰
            </button>
            <div>
              <div className="topbar-title">VisualDiff</div>
              <div className="topbar-sub">Visual Regression Tool</div>
            </div>
          </div>
          <div className="topbar-user-wrap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="topbar-user" title={user}>
              {getInitials(user)}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid #dde3ec",
                color: "#4a5568",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                fontFamily: "'DM Sans', sans-serif",
              }}
              className="vdt-btn-logout"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          <div className={`tab-item ${tab === "compare" ? "active" : ""}`} onClick={() => setTab("compare")}>
            Compare
          </div>
          <div className={`tab-item ${tab === "results" ? "active" : ""}`} onClick={() => setTab("results")}>
            Results {result ? `(${result.diffs} diffs)` : ""}
          </div>
        </div>

        {/* Content */}
        <div className="content-area">
          {tab === "compare" && <ComparePage onRun={handleRun} />}
          {tab === "results" && <ResultsPage result={result} onGoCompare={() => setTab("compare")} />}
        </div>
      </div>
    </div>
  );
}
