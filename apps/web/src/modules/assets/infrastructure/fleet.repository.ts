import { supabase } from "@shared/lib/supabase";

// Lecturas de flota (GPS-2). get_fleet_positions = foto inicial; get_route_stops_for_asset = paradas del track.
export interface FleetPosition {
  assetId: string; assetName: string; assignedToName: string | null;
  lat: number | null; lng: number | null; speed: number | null; heading: number | null;
  accuracy: number | null; recordedAt: string | null; status: string; hasActiveCustody: boolean;
}
export interface RouteStopGeo { id: string; order: number; address: string; lat: number | null; lng: number | null; status: string; completedAt: string | null; clientName: string; serviceType: string }

const num = (v: unknown): number | null => (v == null ? null : Number(v));

export async function getFleetPositions(): Promise<FleetPosition[]> {
  const { data } = await supabase.rpc("get_fleet_positions");
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    assetId: r.asset_id as string, assetName: (r.asset_name as string) ?? "", assignedToName: (r.assigned_to_name as string) ?? null,
    lat: num(r.latitude), lng: num(r.longitude), speed: num(r.speed), heading: num(r.heading), accuracy: num(r.accuracy),
    recordedAt: (r.recorded_at as string) ?? null, status: (r.status as string) ?? "active", hasActiveCustody: r.has_active_custody === true,
  }));
}

export async function getRouteStopsForAsset(assetId: string, day: string): Promise<RouteStopGeo[]> {
  const { data } = await supabase.rpc("get_route_stops_for_asset", { p_asset_id: assetId, p_date: day });
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    id: r.id as string, order: Number(r.order ?? 0), address: (r.address as string) ?? "",
    lat: num(r.lat), lng: num(r.lng), status: (r.status as string) ?? "", completedAt: (r.completedAt as string) ?? null,
    clientName: (r.clientName as string) ?? "", serviceType: (r.serviceType as string) ?? "",
  }));
}
