import { supabase } from "@shared/lib/supabase";

// Driver-view: "mi ruta de hoy" = la ruta del día asignada al usuario (RLS ya restringe a creador/asignado).
export interface DriverStop { id: string; order: number; clientName: string; address: string; serviceType: string; status: string; phone: string; completedAt: string | null }
export interface DriverRoute { id: string; date: string; assetName: string | null; stops: DriverStop[] }

export async function getMyRouteToday(userId: string): Promise<DriverRoute | null> {
  if (!userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("service_routes")
    .select("id, route_date, asset:tenant_assets(name), route_stops(id, stop_order, client_name, address, service_type, status, phone, completed_at)")
    .eq("route_date", today).eq("assigned_to", userId).is("deleted_at", null).order("created_at").limit(1).maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  const a = r.asset as { name?: string } | { name?: string }[] | null;
  const assetName = Array.isArray(a) ? (a[0]?.name ?? null) : (a?.name ?? null);
  const stops = ((r.route_stops as Record<string, unknown>[] | null) ?? []).map((s) => ({
    id: s.id as string, order: Number(s.stop_order ?? 0), clientName: (s.client_name as string) ?? "",
    address: (s.address as string) ?? "", serviceType: (s.service_type as string) ?? "",
    status: (s.status as string) ?? "", phone: (s.phone as string) ?? "", completedAt: (s.completed_at as string) ?? null,
  })).sort((x, y) => x.order - y.order);
  return { id: r.id as string, date: (r.route_date as string) ?? today, assetName, stops };
}
