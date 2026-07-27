import { supabase } from "@shared/lib/supabase";
import type { Aging, InvSnapshot, OpsSnapshot, TrendPoint } from "@finance/domain/dashboard.types";

// Métodos del dashboard DASH-1 (AR/AP aging + inventario + operaciones + tendencia). Se componen por spread
// en supabaseDashboardRepository. Separados para respetar el límite de líneas por archivo.
function aging(res: { data: unknown }): Aging | null {
  const r = (res.data ?? null) as { buckets?: Record<string, unknown>; total_outstanding?: unknown; total_payable?: unknown } | null;
  if (!r) return null;
  const b = r.buckets ?? {};
  const num = (v: unknown) => Number(v ?? 0);
  return { current: num(b.current), b1_30: num(b.b1_30), b31_60: num(b.b31_60), b61_90: num(b.b61_90), b90_plus: num(b.b90_plus), total: Number(r.total_outstanding ?? r.total_payable ?? 0) };
}

export const dashboardExtra = {
  async getArAging(): Promise<Aging | null> { return aging(await supabase.rpc("get_ar_aging")); },
  async getApAging(): Promise<Aging | null> { return aging(await supabase.rpc("get_ap_aging")); },
  async getInventory(): Promise<InvSnapshot | null> {
    const { data } = await supabase.rpc("get_inventory_dashboard");
    const r = (data ?? {}) as Record<string, unknown>;
    return { totalItems: Number(r.total_items ?? 0), totalValue: Number(r.total_value ?? 0), lowStock: Number(r.low_stock ?? 0),
      expiringLots: Number(r.expiring_lots ?? 0), cogsMonth: Number(r.cogs_month ?? 0),
      topConsumed: ((r.top_consumed as { name: string; qty: number }[] | null) ?? []).map((x) => ({ name: x.name, qty: Number(x.qty) })) };
  },
  async getOps(): Promise<OpsSnapshot | null> {
    const { data } = await supabase.rpc("get_ops_dashboard");
    const r = (data ?? {}) as Record<string, unknown>;
    const n = (k: string) => Number(r[k] ?? 0);
    return { routesTotal: n("routes_total"), routesDone: n("routes_done"), stopsTotal: n("stops_total"), stopsDone: n("stops_done"),
      fleetInService: n("fleet_in_service"), geofenceEvents: n("geofence_events_today"), maintAlerts: n("maint_alerts"),
      customersActive: n("customers_active"), customersNew: n("customers_new"), customersDebt: n("customers_debt") };
  },
  async getTrend(): Promise<readonly TrendPoint[]> {
    const { data } = await supabase.rpc("get_trend_series");
    return ((data as Record<string, unknown>[] | null) ?? []).map((p) => ({ month: Number(p.month), income: Number(p.income ?? 0), expenses: Number(p.totalOut ?? 0), profit: Number(p.operatingProfit ?? 0) }));
  },
};
