export default function EventCard({ event, selected, onClick }) {
  const colors = { critical: "var(--red)", warn: "var(--amber)", ok: "var(--green)" };
  const col = colors[event.severity] || "var(--amber)";

  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 10px 10px 12px", border: "1px solid var(--b1)",
        borderLeft: `2px solid ${col}`, borderRadius: 6, marginBottom: 5,
        cursor: "pointer", background: selected ? `${col}08` : "transparent",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: 9, color: "var(--t3)", marginBottom: 2 }}>
        {new Date(event.detected_at).toLocaleTimeString()}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t1)", marginBottom: 2 }}>
        {event.device_id}
      </div>
      <div style={{ fontSize: 10, color: col, fontWeight: 600 }}>
        {event.gap_magnitude > 0 ? "+" : ""}{event.gap_magnitude}°C
      </div>
    </div>
  );
}
