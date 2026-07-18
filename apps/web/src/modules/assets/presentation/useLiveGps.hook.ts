import { useEffect, useState } from "react";
import { latestGpsLog, type LivePosition } from "@assets/infrastructure/live-gps";

// Polling read-only de la última posición GPS cada 30s. NO interfiere con el tracking activo.
export function useLiveGps(assetId: string, enabled: boolean): LivePosition | null {
  const [pos, setPos] = useState<LivePosition | null>(null);
  useEffect(() => {
    if (!enabled) { setPos(null); return; }
    let alive = true;
    const load = () => void latestGpsLog(assetId).then((p) => { if (alive) setPos(p); });
    load();
    const iv = setInterval(load, 30000);
    return () => { alive = false; clearInterval(iv); };
  }, [assetId, enabled]);
  return pos;
}
