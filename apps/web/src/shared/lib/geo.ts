// Utilidades geográficas puras (sin dependencias). Distancia Haversine + link a Google Maps.
export interface GeoPoint { lat: number; lng: number }

const R = 6371000; // radio terrestre en metros
const rad = (d: number) => (d * Math.PI) / 180;

// Distancia entre dos coordenadas en metros (Haversine).
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Suma de distancias entre puntos consecutivos (metros).
export function totalDistance(pts: readonly GeoPoint[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (a && b) d += haversineDistance(a, b);
  }
  return d;
}

// ¿Algún punto del recorrido pasó a menos de `m` metros del objetivo?
export function passedNear(pts: readonly GeoPoint[], target: GeoPoint, m = 200): boolean {
  return pts.some((p) => haversineDistance(p, target) <= m);
}

// Link de direcciones en Google Maps (sin API key). Muestrea ≤ maxPts waypoints.
export function gmapsDirUrl(pts: readonly GeoPoint[], maxPts = 25): string {
  if (pts.length === 0) return "";
  const step = Math.max(1, Math.ceil(pts.length / maxPts));
  const sampled = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  return "https://www.google.com/maps/dir/" + sampled.map((p) => `${p.lat},${p.lng}`).join("/");
}

export const metersToMiles = (m: number) => m / 1609.344;
