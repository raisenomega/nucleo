import { lazy, Suspense, useEffect, useState } from "react";
import type { GpsMapProps } from "@assets/presentation/GpsMapInner";

// Wrapper client-only: leaflet toca window al importar → GpsMapInner se carga por lazy (import dinámico)
// solo tras montar en el cliente. En SSR / pre-montaje se muestra un placeholder del mismo alto (sin salto).
const Inner = lazy(() => import("@assets/presentation/GpsMapInner"));
export type { GpsMarker, GpsPoint, GpsMapProps } from "@assets/presentation/GpsMapInner";

export function GpsMap(props: GpsMapProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const h = props.height ?? "400px";
  const placeholder = <div style={{ height: h }} className="animate-pulse rounded-lg border border-border bg-secondary" />;
  if (!ready) return placeholder;
  return <Suspense fallback={placeholder}><Inner {...props} /></Suspense>;
}
