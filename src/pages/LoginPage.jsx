import React, { useState } from "react";
import { C } from "../constants/theme";
import loginBg from "../../assets/LoginPage.png";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [showP, setShowP] = useState(false);
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);

  const submit = () => {
    if (!email || !pass) { setErr("Please fill in all fields."); return; }
    if (email !== "admin@medtrix.com" || pass !== "admin") {
      setErr("Invalid email or password.");
      return;
    }
    setErr("");
    setBusy(true);
    setTimeout(() => { setBusy(false); onLogin(email); }, 700);
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#5b7694",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
    letterSpacing: "0.5px"
  };

  const inputStyle = {
    width: "100%",
    height: 42,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 14,
    color: "#333",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s"
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      width: "100vw",
      backgroundImage: `url(${loginBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "#f4f5f7",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 8%",
      position: "relative"
    }}>
      {/* floating right card */}
      <div style={{
        width: 440,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: "48px 40px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }} className="fade-in">
        
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 500, color: "#5b7694" }}>
            Visual Diff
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email</label>
          <input 
            style={inputStyle}
            placeholder="admin@medtrix.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} 
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <span style={{ fontSize: 12, color: "#e63946", cursor: "pointer", fontWeight: 500 }}>
              Forgot Password?
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <input 
              type={showP ? "text" : "password"}
              placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} 
              style={{...inputStyle, paddingRight: 40}}
            />
            <span onClick={() => setShowP(v => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                       cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}>
              {showP ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </span>
          </div>
        </div>

        {/* Remember Me */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14,
                        color: "#5b7694", marginBottom: 24, cursor: "pointer" }}>
          <input type="checkbox" style={{ accentColor: "#5b7694", width: 16, height: 16, borderRadius: 4, border: "1px solid #d1d5db" }} /> 
          Remember Me
        </label>

        {err && <div style={{ fontSize: 13, color: "#e63946", marginBottom: 16, textAlign: "center" }}>{err}</div>}

        {/* Submit Button */}
        <button 
          onClick={submit} 
          disabled={busy}
          style={{
            width: "100%",
            height: 44,
            background: "#222222",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 500,
            cursor: busy ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            marginTop: 4
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}