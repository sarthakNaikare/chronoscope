export default function CounterfactualTable({ rows }) {
  if (!rows?.length) return (
    <div style={{ fontSize: 11, color: "var(--t3)", padding: "8px 0" }}>
      select an event to see counterfactual
    </div>
  );

  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead>
          <tr>
            {["bucket", "actual", "shadow", "gap"].map(h => (
              <th key={h} style={{
                fontSize: 8, color: "var(--t3)", letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "4px 8px",
                textAlign: "left", borderBottom: "1px solid var(--b1)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--b1)" }}>
              <td style={{ padding: "6px 8px", color: "var(--t2)" }}>
                {new Date(r.bucket).toLocaleTimeString()}
              </td>
              <td style={{ padding: "6px 8px", color: "var(--blue2)", fontWeight: 600 }}>
                {r.actual_val?.toFixed(1)}°
              </td>
              <td style={{ padding: "6px 8px", color: "var(--amber)" }}>
                {r.projected_val?.toFixed(1)}°
              </td>
              <td style={{ padding: "6px 8px", color: "var(--red)", fontWeight: 700 }}>
                {r.gap > 0 ? "+" : ""}{r.gap?.toFixed(1)}°
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        marginTop: 8, padding: "7px 10px", fontSize: 10,
        background: "rgba(240,160,48,0.06)", border: "1px solid rgba(240,160,48,0.2)",
        borderRadius: 4, color: "var(--amber)",
      }}>
        peak gap: <b>{Math.max(...rows.map(r => r.gap)).toFixed(1)}°C</b>
        {" · "}avg: <b>{(rows.reduce((s, r) => s + r.gap, 0) / rows.length).toFixed(1)}°C</b>
      </div>
    </>
  );
}
