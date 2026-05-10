export default function DeviceCard({ device, selected, onClick }) {
  const colors = { critical: "var(--red)", warn: "var(--amber)", ok: "var(--green)" };
  const col = colors[device.status] || "var(--green)";
  const pct = Math.min(100, Math.round(Math.abs(device.gap) / 26 * 100));

  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 12px", border: `1px solid ${selected ? col : "var(--b1)"}`,
        borderRadius: 7, marginBottom: 6, cursor: "pointer",
        background: selected ? `${col}06` : "transparent", transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t1)" }}>{device.name}</span>
        <span style={{
          fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
          background: `${col}18`, color: col, border: `1px solid ${col}40`,
        }}>
          {device.status.toUpperCase()}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
        {[
          ["Gap", `${device.gap > 0 ? "+" : ""}${device.gap}°C`, col],
          ["Orbit", `${pct}%`, "var(--t2)"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: "var(--s2)", borderRadius: 4, padding: "5px 7px" }}>
            <div style={{ fontSize: 8, color: "var(--t3)", marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 3, background: "var(--b2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}
