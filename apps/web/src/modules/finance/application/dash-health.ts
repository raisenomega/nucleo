import type { DashData } from "@finance/application/useDashboard.hook";

// Semáforo adaptativo: nivel de salud por vista. "general" = el peor de todos los pilares.
export type Level = "g" | "y" | "r";
export type DashView = "general" | "finanzas" | "operaciones" | "cartera" | "inventario" | "comercial";

const worse = (a: Level, b: Level): Level => (a === "r" || b === "r" ? "r" : a === "y" || b === "y" ? "y" : "g");

const fin = (d: DashData): Level => (!d.snapshot ? "y" : d.snapshot.balance < 0 ? "r" : d.fiscal && d.fiscal.operatingProfit < 0 ? "y" : "g");
const ops = (d: DashData): Level => { const o = d.ops; if (!o) return "y"; if (o.routesTotal > 0 && o.routesDone === 0 && o.stopsTotal > o.stopsDone) return "r"; return o.routesTotal > o.routesDone || o.maintAlerts > 0 ? "y" : "g"; };
const cart = (d: DashData): Level => {
  const veryLate = (d.ar?.b61_90 ?? 0) + (d.ar?.b90_plus ?? 0) + (d.ap?.b61_90 ?? 0) + (d.ap?.b90_plus ?? 0);
  const someLate = (d.ar?.b1_30 ?? 0) + (d.ar?.b31_60 ?? 0) + (d.ap?.b1_30 ?? 0) + (d.ap?.b31_60 ?? 0);
  return veryLate > 0 ? "r" : someLate > 0 ? "y" : "g";
};
const inv = (d: DashData): Level => { const i = d.inv; if (!i) return "g"; if (i.expiringLots > 0 || i.lowStockItems.some((x) => x.stock <= 0)) return "r"; return i.lowStock > 0 ? "y" : "g"; };
const com = (d: DashData): Level => { const c = d.crm; if (!c || c.totalLeads === 0) return "r"; return c.conversionRate > 20 ? "g" : c.conversionRate >= 10 ? "y" : "r"; };

export function healthOf(view: DashView, d: DashData): Level {
  switch (view) {
    case "finanzas": return fin(d);
    case "operaciones": return ops(d);
    case "cartera": return cart(d);
    case "inventario": return inv(d);
    case "comercial": return com(d);
    default: return [fin(d), ops(d), cart(d), inv(d), com(d)].reduce(worse, "g");
  }
}
