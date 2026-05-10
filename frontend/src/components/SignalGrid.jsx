export default function SignalGrid({ chunks }) {
  const signals = [
    { key: "dead_tuple_ratio",      label: "Dead tuple ratio",   unit: "%",  warn: 10, bad: 20 },
    { key: "compression_bloat",     label: "Compression bloat",  unit: "×",  warn: 1.5, bad: 2.5 },
    { key: "row_lock_fanout",       label: "Lock fan-out",       unit: "",   warn: 3, bad: 8 },
    { key: "chunk_exclusion_failed",label: "Chunk exclusion",    unit: "",   warn: false, bad: true },
    { key: "autovacuum_lag_minutes",label: "Autovacuum lag",     unit: "m",  warn: 120, bad: 300 },
    { key: "health_score",          label: "Health score",       unit: "",   warn: 70, bad: 50, inverse: true },
  ];

  const worst = chunks?.sort((a, b) => a.health_score - b.health_score)[0];
  if (!worst) return <div style={{ color: "var(--t3)", fontSize: 11 }}>no chunk data</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
      {signals.map(sig => {
        const raw = worst[sig.key];
        const val = raw === true ? "FAILED" : raw === false ? "OK" : `${typeof raw === "number" ? raw.toFixed(sig.unit === "×" ? 1 : 0) : raw}${sig.unit}`;
        let col = "var(--green)";
        if (sig.key === "chunk_exclusion_failed") {
          col = raw ? "var(--red)" : "var(--green)";
        } else if (sig.inverse) {
          col = raw < sig.bad ? "var(--red)" : raw < sig.warn ? "var(--amber)" : "var(--green)";
        } else {
          col = raw > sig.bad ? "var(--red)" : raw > sig.warn ? "var(--amber)" : "var(--green)";
        }
        const pct = sig.key === "health_score" ? raw
          : sig.key === "chunk_exclusion_failed" ? (raw ? 100 : 0)
          : Math.min(100, (raw / sig.bad) * 80);

        return (
          <div key={sig.key} style={{
            padding: "8px 10px", background: "var(--s2)",
            border: "1px solid var(--b1)", borderRadius: 5,
          }}>
            <div style={{ fontSize: 9, color: "var(--t3)", marginBottom: 3 }}>{sig.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</div>
            <div style={{ height: 2, background: "var(--b2)", borderRadius: 1, marginTop: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: col, transition: "width 0.8s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
