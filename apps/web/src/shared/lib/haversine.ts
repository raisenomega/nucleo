// Haversine en TS (versión client-side de _haversine_meters de GPS-4). Distancia entre 2 coords en metros.
const R = 6371000; // radio de la Tierra en metros
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const metersToMiles = (m: number): number => m / 1609.344;

// Millas totales de un track GPS: suma haversine sobre puntos consecutivos.
export function trackMiles(points: readonly { latitude: number; longitude: number }[]): number {
  let meters = 0, prev = points[0];
  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    if (prev && cur) meters += haversineMeters(prev.latitude, prev.longitude, cur.latitude, cur.longitude);
    prev = cur;
  }
  return metersToMiles(meters);
}
