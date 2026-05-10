import { useState } from "react";
import { postInject } from "../utils/api";

export default function Topbar({ onInject }) {
  const [injecting, setInjecting] = useState(false);

  async function handleInject() {
    setInjecting(true);
    try {
      await postInject("device_3");
      onInject();
    } finally {
      setTimeout(() => setInjecting(false), 2000);
    }
  }

  return (
    <header style={{
      gridColumn: "1 / -1", height: 50,
      background: "rgba(11,13,19,0.9)", borderBottom: "1px solid var(--b1)",
      backdropFilter: "blur(16px)", display: "flex", alignItems: "center",
      padding: "0 20px", gap: 16, position: "relative", zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, border: "1px solid rgba(80,128,255,0.5)",
          borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(80,128,255,0.07)",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#5080ff" strokeWidth="1.2"/>
            <circle cx="7" cy="7" r="2" fill="#5080ff" opacity="0.8"/>
            <circle cx="7" cy="7" r="5.5" stroke="#5080ff" strokeWidth="1.2" opacity="0.3">
              <animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="4s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em" }}>
          chrono<span style={{ color: "var(--blue2)" }}>scope</span>
        </span>
      </div>

      <div style={{ width: 1, height: 22, background: "var(--b2)" }} />
      <span style={{ fontSize: 10, color: "var(--t3)" }}>
        <b style={{ color: "var(--t2)", fontWeight: 500 }}>TimescaleDB</b>
        {" · sensor_readings · 5 devices · 30d window"}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
          border: "1px solid rgba(40,212,152,0.25)", borderRadius: 20,
          background: "rgba(40,212,152,0.06)",
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%", background: "var(--green)",
            boxShadow: "0 0 6px var(--green)",
            animation: "blink 1.5s infinite",
          }} />
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
          <span style={{ fontSize: 9, color: "var(--green)", letterSpacing: "0.1em", fontWeight: 600 }}>LIVE</span>
        </div>

        <button
          onClick={handleInject}
          disabled={injecting}
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "6px 16px", border: "1px solid var(--amber)", borderRadius: 5,
            background: injecting ? "var(--amber)" : "rgba(240,160,48,0.08)",
            color: injecting ? "#000" : "var(--amber)", transition: "all 0.2s",
          }}
        >
          {injecting ? "injecting..." : "⊕ inject anomaly"}
        </button>
      </div>
    </header>
  );
}
