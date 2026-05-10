import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents, fetchChunks, fetchCounterfactual } from "./utils/api";
import { usePoller } from "./hooks/usePoller";
import Topbar              from "./components/Topbar";
import Sidebar             from "./components/Sidebar";
import GravityWell         from "./components/GravityWell";
import ChunkRibbon         from "./components/ChunkRibbon";
import KPICard             from "./components/KPICard";
import DeviceCard          from "./components/DeviceCard";
import SignalGrid          from "./components/SignalGrid";
import CounterfactualTable from "./components/CounterfactualTable";
import ExplainPanel        from "./components/ExplainPanel";

const DEVICES_META = [
  { name:"device_1", color:"#5080ff", color2:"#80a8ff", gap:4.2,  status:"warn",     baseAngle:0,           speed:0.008 },
  { name:"device_2", color:"#28d498", color2:"#60f8c0", gap:1.1,  status:"ok",       baseAngle:Math.PI*0.4, speed:0.011 },
  { name:"device_3", color:"#f03858", color2:"#ff6080", gap:18.4, status:"critical", baseAngle:Math.PI*0.8, speed:0.006 },
  { name:"device_4", color:"#9060ff", color2:"#b890ff", gap:2.8,  status:"ok",       baseAngle:Math.PI*1.2, speed:0.013 },
  { name:"device_5", color:"#f0a030", color2:"#ffc060", gap:9.1,  status:"warn",     baseAngle:Math.PI*1.6, speed:0.009 },
];

export default function App() {
  const [activeView,     setActiveView]     = useState("Gravity well");
  const [selectedEvent,  setSelectedEvent]  = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [anomalyActive,  setAnomalyActive]  = useState(false);

  const { data: events = [], refetch: refetchEvents } = useQuery({ queryKey: ["events"],  queryFn: fetchEvents });
  const { data: chunks = []                         } = useQuery({ queryKey: ["chunks"],  queryFn: fetchChunks, refetchInterval: 10000 });
  const { data: cfRows = []                         } = useQuery({
    queryKey: ["cf", selectedEvent?.id],
    queryFn:  () => fetchCounterfactual(selectedEvent.id),
    enabled:  !!selectedEvent,
  });

  usePoller(refetchEvents, 5000);

  const critCount = events.filter(e => e.severity === "critical").length;
  const maxGap    = events.length ? Math.max(...events.map(e => Math.abs(e.gap_magnitude))) : 0;
  const avgHealth = chunks.length ? Math.round(chunks.reduce((s, c) => s + c.health_score, 0) / chunks.length) : 0;

  function renderMain() {
    switch (activeView) {
      case "Gravity well":    return <GravityWell anomalyActive={anomalyActive} />;
      case "Chunk ribbon":    return <ChunkRibbon chunks={chunks} />;
      case "EXPLAIN parser":
        return (
          <div style={{ padding: 24, maxWidth: 700 }}>
            <div style={{ fontSize: 9, letterSpacing:"0.12em", color:"var(--t3)", textTransform:"uppercase", marginBottom: 16 }}>
              EXPLAIN ANALYZE parser
            </div>
            <ExplainPanel />
          </div>
        );
      case "Counterfactual":
        return (
          <div style={{ padding: 24, maxWidth: 700 }}>
            <div style={{ fontSize: 9, letterSpacing:"0.12em", color:"var(--t3)", textTransform:"uppercase", marginBottom: 16 }}>
              chronicle.counterfactual — {selectedEvent ? `event ${selectedEvent.id}` : "select an event from the sidebar first"}
            </div>
            <CounterfactualTable rows={cfRows} />
          </div>
        );
      default: return <GravityWell anomalyActive={anomalyActive} />;
    }
  }

  return (
    <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* topbar — full width */}
      <Topbar onInject={() => { setAnomalyActive(true); refetchEvents(); }} />

      {/* KPI row — full width below topbar */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(4,1fr)",
        background:"var(--b1)", borderBottom:"1px solid var(--b1)",
        flexShrink: 0,
      }}>
        <KPICard label="Active chunks" value={chunks.length || 31}                      sub="7 compressed"        color="var(--green)" />
        <KPICard label="Events (24h)"  value={events.length}                            sub={`${critCount} critical`} color={critCount > 0 ? "var(--amber)" : "var(--green)"} />
        <KPICard label="Max gap"       value={maxGap ? `+${maxGap.toFixed(1)}°C` : "—"} sub="across all devices"  color="var(--amber)" />
        <KPICard label="Avg health"    value={avgHealth || 82}                           sub="chunk health score"  color={avgHealth < 60 ? "var(--red)" : "var(--green)"} />
      </div>

      {/* three column body */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"200px 1fr 260px", overflow:"hidden", minHeight:0 }}>

        {/* left sidebar */}
        <Sidebar
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={e => { setSelectedEvent(e); setActiveView("Counterfactual"); }}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* center — main view */}
        <main style={{ overflow:"hidden", position:"relative", minHeight:0 }}>
          {renderMain()}
        </main>

        {/* right sidebar */}
        <aside style={{
          background:"rgba(11,13,19,0.75)", borderLeft:"1px solid var(--b1)",
          backdropFilter:"blur(12px)", overflowY:"auto", display:"flex", flexDirection:"column",
        }}>
          <div style={{ borderBottom:"1px solid var(--b1)", padding:12 }}>
            <div style={{ fontSize:9, letterSpacing:"0.1em", color:"var(--t3)", textTransform:"uppercase", marginBottom:10 }}>
              Device orbits
            </div>
            {DEVICES_META.map(d => (
              <DeviceCard
                key={d.name} device={d}
                selected={selectedDevice === d.name}
                onClick={() => setSelectedDevice(d.name)}
              />
            ))}
          </div>

          <div style={{ borderBottom:"1px solid var(--b1)", padding:12 }}>
            <div style={{ fontSize:9, letterSpacing:"0.1em", color:"var(--t3)", textTransform:"uppercase", marginBottom:10 }}>
              Chunk signals
            </div>
            <SignalGrid chunks={chunks} />
          </div>

          <div style={{ borderBottom:"1px solid var(--b1)", padding:12 }}>
            <div style={{ fontSize:9, letterSpacing:"0.1em", color:"var(--t3)", textTransform:"uppercase", marginBottom:10 }}>
              chronicle.counterfactual({selectedEvent ? `evt_${selectedEvent.id}` : "..."})
            </div>
            <CounterfactualTable rows={cfRows} />
          </div>

          <div style={{ padding:12 }}>
            <div style={{ fontSize:9, letterSpacing:"0.1em", color:"var(--t3)", textTransform:"uppercase", marginBottom:10 }}>
              EXPLAIN ANALYZE
            </div>
            <ExplainPanel />
          </div>
        </aside>

      </div>
    </div>
  );
}
