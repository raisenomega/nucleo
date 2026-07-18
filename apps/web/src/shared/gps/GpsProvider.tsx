import { useEffect, useState, type ReactNode } from "react";
import { GpsContext } from "@shared/gps/gps-context";
import { getActiveGps, setActiveGps, clearActiveGps, type GpsActive } from "@shared/gps/gps-session";
import { useGpsWatch } from "@shared/gps/useGpsWatch";

// Provider global (dentro del layout autenticado): reanuda tracking tras navegación y expone start/stop.
export function GpsProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<GpsActive | null>(null);
  useEffect(() => { setActive(getActiveGps()); }, []); // client-only: reanuda si había custodia activa
  const status = useGpsWatch(active);
  const start = (a: GpsActive) => { setActiveGps(a); setActive(a); };
  const stop = () => { clearActiveGps(); setActive(null); };
  return <GpsContext.Provider value={{ status, active, start, stop }}>{children}</GpsContext.Provider>;
}
