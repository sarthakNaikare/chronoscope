import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents, fetchChunks, fetchCounterfactual } from "./utils/api";
import { usePoller } from "./hooks/usePoller";
import Topbar               from "./components/Topbar";
import Sidebar              from "./components/Sidebar";
import GravityWell          from "./components/GravityWell";
import KPICard              from "./components/KPICard";
import DeviceCard           from "./components/DeviceCard";
import SignalGrid           from "./components/SignalGrid";
import CounterfactualTable  from "./components/CounterfactualTable";
import ExplainPanel         from "./components/ExplainPanel";

const DEVICES_META = [
  { name:"device_1", color:"#5080ff", color2:"#80a8ff", gap:4.2,  status:"warn"     },
  { name:"device_2", color:"#28d498", color2:"#60f8c0", gap:1.1,  status:"ok"       },
  { name:"device_3", color:"#f03858", color2:"#ff6080", gap:18.4, status:"critical" },
  { name:"device_4", color:"#9060ff", color2:"#b890ff", gap:2.8,  status:"ok"       },
  { name:"device_5", color:"#f0a030", color2:"#ffc060", gap:9.1,  status:"warn"     },
];

export default function App() {
  const [selectedEvent,  setSelectedEvent]  = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [anomalyActive,  setAnomalyActive]  = useState(false);

  const { data: events  = [], refetch: refetchEvents } = useQuery({ queryKey: ["events"],  queryFn: fetchEvents  });
  const { data: chunks  = []                         } = useQuery({ queryKey: ["chunks"],  queryFn: fetchChunks, refetchInterval: 10000 });
  const { data: cfRows  = []                         } = useQuery({
    queryKey: ["cf", selectedEvent?.id],
    queryFn:  () => fetchCounterfactual(selectedEvent.id),
    enabled:  !!selectedEvent,
  });

  usePoller(refetchEvents, 5000);

  const critCount  = events.filter(e => e.severity === "critical").length;
  const maxGap     = events.length ? Math.max(...events.map(e => Math.abs(e.gap_magnitude))) : 0;
  const avgHealth  = chunks.length ? Math.round(chunks.reduce((s, c) => s + c.health_score, 0) / chunks.length) : 0;

  return (
    <div style={{ width: "100vw", height: "100vh", display: "grid", gridTemplateColumns: "200px 1fr 260px", gridTemplateRows: "50px 1fr", overflow: "hidden" }}>
      <Topbar onInject={() => { setAnomalyActive(true); refetchEvents(); }} />

      <Sidebar events={events} selectedEvent={selectedEvent} onSelectEvent={e => { setSelectedEvent(e); }} />

      <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--b1)", borderBottom: "1px solid var(--b1)", flexShrink: 0 }}>
          <KPICard label="Active chunks"  value={chunks.length || 31}        sub="7 compressed"         color="var(--green)"  />
          <KPICard label="Events (24h)"   value={events.length}              sub={`${critCount} critical`} color={critCount > 0 ? "var(--amber)" : "var(--green)"} />
          <KPICard label="Max gap"        value={maxGap ? `+${maxGap.toFixed(1)}°C` : "—"} sub="across all devices" color="var(--amber)" />
          <KPICard label="Avg health"     value={avgHealth || 82}            sub="chunk health score"   color={avgHealth < 60 ? "var(--red)" : "var(--green)"} />
        </div>

        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <GravityWell anomalyActive={anomalyActive} />
        </div>
      </main>

      <aside style={{
        background: "rgba(11,13,19,0.75)", borderLeft: "1px solid var(--b1)",
        backdropFilter: "blur(12px)", overflowY: "auto", display: "flex", flexDirection: "column",
      }}>
        <div style={{ borderBottom: "1px solid var(--b1)", padding: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 10 }}>Device orbits</div>
          {DEVICES_META.map(d => (
            <DeviceCard key={d.name} device={d} selected={selectedDevice === d.name} onClick={() => setSelectedDevice(d.name)} />
          ))}
        </div>

        <div style={{ borderBottom: "1px solid var(--b1)", padding: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 10 }}>Chunk signals</div>
          <SignalGrid chunks={chunks} />
        </div>

        <div style={{ borderBottom: "1px solid var(--b1)", padding: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 10 }}>
            chronicle.counterfactual({selectedEvent ? `evt_${selectedEvent.id}` : "..."})
          </div>
          <CounterfactualTable rows={cfRows} />
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 10 }}>EXPLAIN ANALYZE</div>
          <ExplainPanel />
        </div>
      </aside>
    </div>
  );
}
