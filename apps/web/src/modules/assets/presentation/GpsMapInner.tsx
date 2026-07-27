import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Mapa base con leaflet directo (BSD-2, sin react-leaflet). Usa circleMarker → sin PNGs/iconos (CSP-safe).
// Client-only: se carga vía lazy desde GpsMap (leaflet toca window en import → nunca en SSR).
export interface GpsMarker { lat: number; lng: number; label?: string; color?: string }
export interface GpsPoint { lat: number; lng: number; timestamp?: string }
export interface GpsCircle { lat: number; lng: number; radius: number; color?: string }
export interface GpsMapProps { center: [number, number]; zoom?: number; markers?: GpsMarker[]; track?: GpsPoint[]; circles?: GpsCircle[]; height?: string }

const OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export default function GpsMapInner({ center, zoom = 10, markers = [], track, circles = [], height = "400px" }: GpsMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([center, zoom, markers, track, circles]);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView(center, zoom);
    L.tileLayer(OSM, { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    circles.forEach((c) => L.circle([c.lat, c.lng], { radius: c.radius, color: c.color ?? "royalblue", weight: 2, fillOpacity: 0.08 }).addTo(map));
    markers.forEach((m) =>
      L.circleMarker([m.lat, m.lng], { radius: 8, color: m.color ?? "royalblue", fillColor: m.color ?? "royalblue", fillOpacity: 0.9, weight: 2 })
        .addTo(map).bindPopup(m.label ?? `${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}`));
    if (track && track.length > 1) {
      const line = L.polyline(track.map((p) => [p.lat, p.lng] as [number, number]), { color: "royalblue", weight: 4, opacity: 0.7 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    } else if (markers.length > 1) {
      map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 40] });
    } else if (circles.length === 1 && circles[0]) {
      map.fitBounds(L.latLng(circles[0].lat, circles[0].lng).toBounds(circles[0].radius * 2.4));
    }
    return () => { map.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <div ref={ref} style={{ height, width: "100%" }} className="z-0 rounded-lg border border-border" />;
}
