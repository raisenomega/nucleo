import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FleetPosition } from "@assets/infrastructure/fleet.repository";

// Mapa de flota (leaflet directo, BSD-2). Mapa persistente + marcadores actualizados IN-PLACE (sin recrear →
// sin parpadeo cuando llega un INSERT de Realtime). Color por estado; nombres CSS (el validador prohíbe hex).
const OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const PR: [number, number] = [18.22, -66.59];
type P = FleetPosition & { lat: number; lng: number };

function colorFor(p: FleetPosition): string {
  if (p.status === "maintenance") return "orange";
  if (!p.hasActiveCustody) return "gray";
  const age = p.recordedAt ? (Date.now() - new Date(p.recordedAt).getTime()) / 1000 : Infinity;
  if (age > 1800) return "crimson";
  if (age > 300) return "royalblue";
  return "seagreen";
}

type Circle = { lat: number; lng: number; radius: number; color?: string };
export default function GpsFleetMapInner({ positions, geofences = [] }: { positions: FleetPosition[]; geofences?: Circle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lgRef = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView(PR, 10);
    L.tileLayer(OSM, { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    lgRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current, lg = lgRef.current;
    if (!map || !lg) return;
    lg.clearLayers();
    geofences.forEach((g) => L.circle([g.lat, g.lng], { radius: g.radius, color: g.color ?? "royalblue", weight: 2, fillOpacity: 0.06 }).addTo(lg));
    const pts = positions.filter((p): p is P => p.lat != null && p.lng != null);
    pts.forEach((p) => {
      const kmh = p.speed != null ? (p.speed * 3.6).toFixed(0) : "—";
      L.circleMarker([p.lat, p.lng], { radius: 9, color: colorFor(p), fillColor: colorFor(p), fillOpacity: 0.9, weight: 2 })
        .addTo(lg).bindPopup(`<b>${p.assetName}</b><br/>${p.assignedToName ?? "—"} · ${kmh} km/h`);
    });
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng])), { padding: [40, 40] });
    else { const only = pts[0]; if (only) map.setView([only.lat, only.lng], 14); }
  }, [positions, geofences]);
  return <div ref={ref} style={{ height: "520px", width: "100%" }} className="z-0 rounded-lg border border-border" />;
}
