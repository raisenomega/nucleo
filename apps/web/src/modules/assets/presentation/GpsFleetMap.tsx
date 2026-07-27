import { lazy, Suspense, useEffect, useState } from "react";
import type { FleetPosition } from "@assets/infrastructure/fleet.repository";

// Wrapper client-only (leaflet toca window al importar → lazy tras montar; nunca en SSR).
const Inner = lazy(() => import("@assets/presentation/GpsFleetMapInner"));

type Circle = { lat: number; lng: number; radius: number; color?: string };
export function GpsFleetMap({ positions, geofences }: { positions: FleetPosition[]; geofences?: Circle[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const ph = <div style={{ height: "520px" }} className="animate-pulse rounded-lg border border-border bg-secondary" />;
  if (!ready) return ph;
  return <Suspense fallback={ph}><Inner positions={positions} geofences={geofences} /></Suspense>;
}
