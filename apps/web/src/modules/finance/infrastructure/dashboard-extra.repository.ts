import { supabase } from "@shared/lib/supabase";
import type { Aging, InvSnapshot, OpsSnapshot, TrendPoint, QuotesSummary, FleetPos } from "@finance/domain/dashboard.types";
import type { Result } from "@finance/domain/payroll.types";

// Métodos del dashboard DASH-1/2 (AR/AP aging + inventario + operaciones + tendencia + cotizaciones + flota).
// Se componen por spread en supabaseDashboardRepository. Separados por el límite de líneas por archivo.
// Todos devuelven Result: antes un fallo daba ceros o listas vacías, que en un panel de dinero se leen como
// «no hubo actividad» (auditoría E2E §13). En aging el null SÍ es negocio válido («sin cuentas»), y por eso
// viaja dentro del ok:true en vez de confundirse con el error.
const num = (v: unknown): number => Number(v ?? 0);
type Res = { data: unknown; error: { message: string } | null };

function aging(res: Res): Result<Aging | null, string> {
  if (res.error) return { ok: false, error: res.error.message };
  const r = (res.data ?? null) as { buckets?: Record<string, unknown>; total_outstanding?: unknown; total_payable?: unknown; by_customer?: { customer_name?: string; outstanding?: unknown }[] } | null;
  if (!r) return { ok: true, value: null };
  const b = r.buckets ?? {};
  return { ok: true, value: { current: num(b.current), b1_30: num(b.b1_30), b31_60: num(b.b31_60), b61_90: num(b.b61_90), b90_plus: num(b.b90_plus),
    total: Number(r.total_outstanding ?? r.total_payable ?? 0),
    byCustomer: (r.by_customer ?? []).map((c) => ({ name: c.customer_name ?? "—", outstanding: num(c.outstanding) })) } };
}

export const dashboardExtra = {
  async getArAging(): Promise<Result<Aging | null, string>> { return aging(await supabase.rpc("get_ar_aging")); },
  async getApAging(): Promise<Result<Aging | null, string>> { return aging(await supabase.rpc("get_ap_aging")); },
  async getInventory(): Promise<Result<InvSnapshot, string>> {
    const { data, error } = await supabase.rpc("get_inventory_dashboard");
    if (error) return { ok: false, error: error.message };
    const r = (data ?? {}) as Record<string, unknown>;
    const list = <T,>(k: string) => (r[k] as T[] | null) ?? [];
    return { ok: true, value: { totalItems: num(r.total_items), totalValue: num(r.total_value), lowStock: num(r.low_stock), expiringLots: num(r.expiring_lots), cogsMonth: num(r.cogs_month),
      topConsumed: list<{ name: string; qty: number }>("top_consumed").map((x) => ({ name: x.name, qty: num(x.qty) })),
      byWarehouse: list<{ name: string; value: number }>("by_warehouse").map((x) => ({ name: x.name, value: num(x.value) })),
      lowStockItems: list<{ name: string; stock: number; min: number }>("low_stock_items").map((x) => ({ name: x.name, stock: num(x.stock), min: num(x.min) })),
      expiringList: list<{ name: string; lot: string; expiry: string }>("expiring_list").map((x) => ({ name: x.name, lot: x.lot ?? "—", expiry: x.expiry ?? "" })) } };
  },
  async getOps(): Promise<Result<OpsSnapshot, string>> {
    const { data, error } = await supabase.rpc("get_ops_dashboard");
    if (error) return { ok: false, error: error.message };
    const r = (data ?? {}) as Record<string, unknown>;
    return { ok: true, value: { routesTotal: num(r.routes_total), routesDone: num(r.routes_done), stopsTotal: num(r.stops_total), stopsDone: num(r.stops_done),
      fleetInService: num(r.fleet_in_service), geofenceEvents: num(r.geofence_events_today), maintAlerts: num(r.maint_alerts),
      customersActive: num(r.customers_active), customersNew: num(r.customers_new), customersDebt: num(r.customers_debt) } };
  },
  async getTrend(): Promise<Result<readonly TrendPoint[], string>> {
    const { data, error } = await supabase.rpc("get_trend_series");
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: ((data as Record<string, unknown>[] | null) ?? []).map((p) => ({ month: num(p.month), income: num(p.income), expenses: num(p.totalOut), profit: num(p.operatingProfit) })) };
  },
  async getQuotes(): Promise<Result<QuotesSummary, string>> {
    const { data, error } = await supabase.rpc("get_quotes_summary");
    if (error) return { ok: false, error: error.message };
    const r = (data ?? {}) as Record<string, unknown>;
    return { ok: true, value: { sent: num(r.sent), draft: num(r.draft), accepted: num(r.accepted), rejected: num(r.rejected), expired: num(r.expired), totalQuoted: num(r.total_quoted) } };
  },
  async getFleet(): Promise<Result<readonly FleetPos[], string>> {
    const { data, error } = await supabase.rpc("get_fleet_positions");
    if (error) return { ok: false, error: error.message };
    return { ok: true, value: ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({ name: (r.asset_name as string) ?? "—", assignedTo: (r.assigned_to_name as string) ?? null,
      status: (r.status as string) ?? "", lat: r.latitude == null ? null : num(r.latitude), lng: r.longitude == null ? null : num(r.longitude),
      speed: r.speed == null ? null : num(r.speed), hasCustody: r.has_active_custody === true })) };
  },
};
