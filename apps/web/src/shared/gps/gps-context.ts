import { createContext, useContext } from "react";
import type { GpsActive } from "@shared/gps/gps-session";
import type { GpsStatus } from "@shared/gps/useGpsWatch";

export interface GpsCtx { status: GpsStatus; active: GpsActive | null; start: (a: GpsActive) => void; stop: () => void }
export const GpsContext = createContext<GpsCtx | null>(null);

export function useGps(): GpsCtx {
  const c = useContext(GpsContext);
  if (!c) throw new Error("useGps debe usarse dentro de GpsProvider");
  return c;
}
