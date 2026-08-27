import React, { useState, useCallback } from "react";
// import LoginPage   from "./pages/LoginPage";
import ComparePage from "./pages/ComparePage";
import ResultsPage from "./pages/ResultsPage";
import { useAuth }    from "./hooks/useAuth";
import { getInitials } from "./utils/user";

export default function App() {
  const { user, logout } = useAuth();

  const [tab,         setTab]         = useState("compare");
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Called by ComparePage's hook when a compare run finishes
  const handleRunComplete = useCallback((data) => {
    setResult(data);
    setTab("results");
    setLoading(false);
  }, []);

  // Login temporarily bypassed so direct URL entry opens the dashboard.
  // if (!user) return <LoginPage onLogin={() => {}} />;

  const totalPages = result?.results?.length ?? 0;

  return (
    <div className="app-root">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">Capturing and comparing…</div>
        </div>
      )}

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-logo-wrap">
          <div className="sidebar-logo">V</div>
          <div>
            <div className="sidebar-brand-text">Visual_Differ</div>
            <div className="sidebar-brand-sub">Regression Tool</div>
          </div>
        </div>

        <div className="sidebar-nav-section">Main</div>

        <div
          className={`sidebar-icon ${tab === "compare" ? "active" : ""}`}
          onClick={() => { setTab("compare"); setSidebarOpen(false); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setTab("compare")}
        >
          <span className="sidebar-icon-emoji" aria-hidden="true">⊞</span>
          <span className="sidebar-icon-label">Compare</span>
        </div>

        <div
          className={`sidebar-icon ${tab === "results" ? "active" : ""}`}
          onClick={() => { setTab("results"); setSidebarOpen(false); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setTab("results")}
        >
          <span className="sidebar-icon-emoji" aria-hidden="true">◫</span>
          <span className="sidebar-icon-label">Results</span>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="main-panel">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div>
              <div className="topbar-title">Visual_Differ</div>
              <div className="topbar-sub">Visual Regression Tool</div>
            </div>
          </div>

          {/* <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="topbar-user" title={user}>{getInitials(user)}</div>
            <button
              onClick={logout}
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
            >
              Sign Out
            </button>
          </div> */}
        </div>

        <div className="tab-bar">
          <div
            className={`tab-item ${tab === "compare" ? "active" : ""}`}
            onClick={() => setTab("compare")}
            role="tab"
            aria-selected={tab === "compare"}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setTab("compare")}
          >
            Compare
          </div>
          <div
            className={`tab-item ${tab === "results" ? "active" : ""}`}
            onClick={() => setTab("results")}
            role="tab"
            aria-selected={tab === "results"}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setTab("results")}
          >
            Results{totalPages > 0 ? ` (${totalPages} page${totalPages !== 1 ? "s" : ""})` : ""}
          </div>
        </div>

        <div className="content-area">
          {tab === "compare" && (
            <ComparePage onRunComplete={handleRunComplete} />
          )}
          {tab === "results" && (
            <ResultsPage result={result} onGoCompare={() => setTab("compare")} />
          )}
        </div>
      </div>
    </div>
  );
}
