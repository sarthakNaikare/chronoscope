import { useState } from "react";
import { postExplain } from "../utils/api";

export default function ExplainPanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  async function run() {
    if (!text.trim()) return;
    const r = await postExplain(text);
    setResult(r);
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="paste EXPLAIN ANALYZE output here..."
        style={{
          width: "100%", height: 70, background: "var(--s2)",
          border: "1px solid var(--b1)", borderRadius: 5, padding: "8px 10px",
          fontSize: 10, color: "var(--t2)", fontFamily: "var(--mono)",
          resize: "none", outline: "none",
        }}
      />
      <button
        onClick={run}
        style={{
          marginTop: 6, fontSize: 10, fontWeight: 600, padding: "5px 14px",
          border: "1px solid var(--blue)", borderRadius: 4,
          background: "rgba(80,128,255,0.1)", color: "var(--blue2)",
        }}
      >
        parse
      </button>
      {result && (
        <div style={{
          marginTop: 8, background: "var(--s2)", border: "1px solid var(--b1)",
          borderRadius: 5, padding: "10px 12px", fontSize: 10, lineHeight: 1.9,
          fontFamily: "var(--mono)", color: "var(--t2)", whiteSpace: "pre",
        }}>
          {`chunks scanned:  `}<span style={{ color: result.chunks_scanned > 3 ? "var(--red)" : "var(--green)" }}>{result.chunks_scanned}</span>{"\n"}
          {`chunks excluded: `}<span style={{ color: "var(--green)" }}>{result.chunks_excluded}</span>{"\n"}
          {`buffer hit:      `}<span style={{ color: result.buffer_hit_ratio < 80 ? "var(--red)" : "var(--green)" }}>{result.buffer_hit_ratio}%</span>{"\n"}
          {`\ndiagnosis: `}<span style={{ color: "var(--amber)" }}>{result.diagnosis}</span>{"\n"}
          {`est. savings: `}<span style={{ color: "var(--green)" }}>{result.estimated_savings_seconds}s</span>
        </div>
      )}
    </div>
  );
}
