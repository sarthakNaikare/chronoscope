import { useOrbitCanvas } from "../hooks/useOrbitCanvas";

const DEVICES = [
  { name:"device_1", color:"#5080ff", color2:"#80a8ff", gap:4.2,  status:"warn",     baseAngle:0,              speed:0.008 },
  { name:"device_2", color:"#28d498", color2:"#60f8c0", gap:1.1,  status:"ok",       baseAngle:Math.PI*0.4,    speed:0.011 },
  { name:"device_3", color:"#f03858", color2:"#ff6080", gap:18.4, status:"critical", baseAngle:Math.PI*0.8,    speed:0.006 },
  { name:"device_4", color:"#9060ff", color2:"#b890ff", gap:2.8,  status:"ok",       baseAngle:Math.PI*1.2,    speed:0.013 },
  { name:"device_5", color:"#f0a030", color2:"#ffc060", gap:9.1,  status:"warn",     baseAngle:Math.PI*1.6,    speed:0.009 },
];

export default function GravityWell({ anomalyActive }) {
  const canvasRef = useOrbitCanvas(DEVICES, anomalyActive);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(26,31,46,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(26,31,46,0.5) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        background: "radial-gradient(ellipse 80% 70% at 50% 50%,transparent 30%,rgba(5,6,10,0.7) 100%)",
      }} />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 2 }} />
      <div style={{
        position: "absolute", top: 12, left: 14, zIndex: 3,
        display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        {[
          ["actual orbit",        "#5080ff"],
          ["shadow projection",   "#f0a030"],
          ["critical deviation",  "#f03858"],
          ["memory trail",        "#454e6a"],
        ].map(([label, color]) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
            background: "rgba(11,13,19,0.85)", border: "1px solid var(--b1)",
            borderRadius: 20, fontSize: 9, color: "var(--t2)", backdropFilter: "blur(8px)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            {label}
          </div>
        ))}
      </div>
      <div style={{
        position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
        fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
        color: "var(--t3)", whiteSpace: "nowrap", zIndex: 3,
      }}>
        orbit radius = gap magnitude · trail color = deviation history
      </div>
    </div>
  );
}
