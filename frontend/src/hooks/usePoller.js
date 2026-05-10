import { useEffect } from "react";
import { pollDetector } from "../utils/api";

export function usePoller(refetch, intervalMs = 5000) {
  useEffect(() => {
    const tick = async () => { await pollDetector(); refetch(); };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [refetch, intervalMs]);
}
