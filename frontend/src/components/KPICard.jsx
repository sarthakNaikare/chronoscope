export default function KPICard({ label, value, sub, color = "var(--t1)" }) {
  return (
    <div style={{
      background: "var(--s1)", padding: "14px 16px",
      borderRight: "1px solid var(--b1)",
    }}>
      <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, fontFamily: "var(--mono)" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}
