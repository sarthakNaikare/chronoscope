import EventCard from "./EventCard";

const NAV = ["Gravity well", "Chunk ribbon", "EXPLAIN parser", "Counterfactual"];
const TABLES = [
  { name: "sensor_readings", status: "green" },
  { name: "device_metrics",  status: "amber" },
  { name: "system_logs",     status: "blue"  },
];

export default function Sidebar({ events, selectedEvent, onSelectEvent, activeView, onViewChange }) {
  return (
    <aside style={{
      background: "rgba(11,13,19,0.75)", borderRight: "1px solid var(--b1)",
      backdropFilter: "blur(12px)", display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>
      <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--b1)" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--t4)", textTransform: "uppercase", marginBottom: 8 }}>
          Views
        </div>
        {NAV.map((n) => (
          <div
            key={n}
            onClick={() => onViewChange(n)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
              borderRadius: 5, cursor: "pointer", fontSize: 11, marginBottom: 2,
              background: activeView === n ? "rgba(80,128,255,0.08)" : "transparent",
              color: activeView === n ? "var(--blue2)" : "var(--t3)",
              border: activeView === n ? "1px solid rgba(80,128,255,0.2)" : "1px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
            {n}
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 12px", flex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--t4)", textTransform: "uppercase", marginBottom: 8 }}>
          ChronoEvents
        </div>
        {events?.length
          ? events.map(e => (
              <EventCard
                key={e.id} event={e}
                selected={selectedEvent?.id === e.id}
                onClick={() => onSelectEvent(e)}
              />
            ))
          : <div style={{ fontSize: 11, color: "var(--t3)" }}>no events yet</div>
        }
      </div>

      <div style={{ padding: "14px 12px", borderTop: "1px solid var(--b1)" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--t4)", textTransform: "uppercase", marginBottom: 8 }}>
          Hypertables
        </div>
        {TABLES.map(t => (
          <div key={t.name} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
            borderRadius: 5, cursor: "pointer", fontSize: 10, color: "var(--t3)", marginBottom: 2,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: `var(--${t.status})`, flexShrink: 0 }} />
            {t.name}
          </div>
        ))}
      </div>
    </aside>
  );
}
