export default function ChunkRibbon({ chunks }) {
  if (!chunks?.length) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--t3)", fontSize: 11 }}>
      loading chunk data...
    </div>
  );

  return (
    <div style={{ padding: 20, height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 16 }}>
        {chunks.length} active chunks — sensor_readings hypertable
      </div>

      {/* scrollable ribbon */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 12, marginBottom: 20 }}>
        {chunks.map((c, i) => {
          const col = c.health_score >= 80 ? "#28d498" : c.health_score >= 55 ? "#f0a030" : "#f03858";
          return (
            <div key={i} style={{
              flexShrink: 0, width: 38, height: 90, borderRadius: 5,
              border: `1px solid ${c.health_score < 55 ? col : "var(--b1)"}`,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "flex-end", padding: 4, cursor: "pointer",
              position: "relative", overflow: "hidden", transition: "border-color 0.2s",
              background: "var(--s2)",
            }}>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: `${c.health_score}%`,
                background: `${col}18`,
                borderTop: `2px solid ${col}`,
                transition: "height 0.5s ease",
              }} />
              <div style={{ fontSize: 8, color: "var(--t3)", position: "relative", zIndex: 1, marginBottom: 2 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: col, position: "relative", zIndex: 1 }}>
                {c.health_score}
              </div>
            </div>
          );
        })}
      </div>

      {/* detail table */}
      <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 10 }}>
        Chunk diagnostics
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead>
          <tr>
            {["chunk", "health", "dead tuples", "bloat", "locks", "exclusion", "vac lag"].map(h => (
              <th key={h} style={{
                fontSize: 8, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "5px 8px", textAlign: "left", borderBottom: "1px solid var(--b1)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chunks.map((c, i) => {
            const col = c.health_score >= 80 ? "var(--green)" : c.health_score >= 55 ? "var(--amber)" : "var(--red)";
            return (
              <tr key={i} style={{ borderBottom: "1px solid var(--b1)" }}>
                <td style={{ padding: "6px 8px", color: "var(--t2)", fontFamily: "var(--mono)", fontSize: 9 }}>
                  {c.chunk_name?.split("_").slice(-2).join("_") || `chunk_${i+1}`}
                </td>
                <td style={{ padding: "6px 8px", color: col, fontWeight: 700 }}>{c.health_score}</td>
                <td style={{ padding: "6px 8px", color: c.dead_tuple_ratio > 10 ? "var(--red)" : "var(--t2)" }}>
                  {c.dead_tuple_ratio?.toFixed(1)}%
                </td>
                <td style={{ padding: "6px 8px", color: c.compression_bloat > 2 ? "var(--amber)" : "var(--t2)" }}>
                  {c.compression_bloat?.toFixed(1)}×
                </td>
                <td style={{ padding: "6px 8px", color: c.lock_contention === "high" ? "var(--red)" : "var(--t2)" }}>
                  {c.lock_contention}
                </td>
                <td style={{ padding: "6px 8px", color: c.chunk_exclusion_failed ? "var(--red)" : "var(--green)", fontWeight: 600 }}>
                  {c.chunk_exclusion_failed ? "FAILED" : "OK"}
                </td>
                <td style={{ padding: "6px 8px", color: "var(--t2)" }}>
                  {c.autovacuum_lag_minutes > 9000 ? "never" : `${Math.round(c.autovacuum_lag_minutes)}m`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
