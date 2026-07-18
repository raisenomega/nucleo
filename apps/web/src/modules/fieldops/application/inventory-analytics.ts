// Helpers puros de analítica de inventario (sin imports de React/infra). Reciben `now` para ser deterministas.
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export interface RawMov { itemId: string; type: string; quantity: number; unitCost: number; date: string }
// Valor del item con fallback: avg_cost recalculado en restock; si 0 (nunca repuesto), usa unit_cost.
export const itemValue = (i: { stock: number; avgCost: number; unitCost: number }) => i.stock * (i.avgCost || i.unitCost || 0);
const IN = new Set(["entrada", "devolucion"]);
const OUT = new Set(["salida", "venta_publica", "merma"]);
const ym = (d: string) => d.slice(0, 7);
const months = (n: number, now: Date) => Array.from({ length: n }, (_, k) => new Date(now.getFullYear(), now.getMonth() - (n - 1 - k), 1).toISOString().slice(0, 7));

export function monthlyInOut(movs: RawMov[], now: Date, n = 6) {
  return months(n, now).map((m) => ({
    month: m.slice(5),
    ins: movs.filter((x) => ym(x.date) === m && IN.has(x.type)).reduce((s, x) => s + x.quantity, 0),
    outs: movs.filter((x) => ym(x.date) === m && OUT.has(x.type)).reduce((s, x) => s + x.quantity, 0),
  }));
}
export function topConsumed(movs: RawMov[], items: readonly InventoryItem[], now: Date, days = 30, top = 5) {
  const cut = new Date(now.getTime() - days * 864e5).toISOString().slice(0, 10);
  const by = new Map<string, number>();
  movs.filter((x) => OUT.has(x.type) && x.date >= cut).forEach((x) => by.set(x.itemId, (by.get(x.itemId) ?? 0) + x.quantity));
  return [...by.entries()].map(([id, qty]) => ({ name: items.find((i) => i.id === id)?.name ?? "?", qty })).sort((a, b) => b.qty - a.qty).slice(0, top);
}
function reverse(months6: string[], start: number, net: (m: string) => number, key: string) {
  const out: Record<string, number | string>[] = []; let run = start;
  for (let k = months6.length - 1; k >= 0; k--) { const m = months6[k]!; out[k] = { month: m.slice(5), [key]: Math.round(run) }; run -= net(m); }
  return out;
}
export function valueByMonth(movs: RawMov[], items: readonly InventoryItem[], now: Date, n = 6) {
  const cur = items.reduce((s, i) => s + itemValue(i), 0);
  const avg = (id: string) => { const it = items.find((i) => i.id === id); return it ? (it.avgCost || it.unitCost || 0) : 0; };
  const net = (m: string) => movs.filter((x) => ym(x.date) === m).reduce((s, x) => s + (IN.has(x.type) ? 1 : -1) * x.quantity * avg(x.itemId), 0);
  return reverse(months(n, now), cur, net, "value") as { month: string; value: number }[];
}
export function stockTrend(movs: RawMov[], itemId: string, currentStock: number, now: Date, n = 6) {
  const net = (m: string) => movs.filter((x) => x.itemId === itemId && ym(x.date) === m).reduce((s, x) => s + (IN.has(x.type) ? 1 : -1) * x.quantity, 0);
  return reverse(months(n, now), currentStock, net, "stock") as { month: string; stock: number }[];
}
export function cumCost(movs: RawMov[], itemId: string, now: Date, n = 6) {
  let acc = 0;
  return months(n, now).map((m) => { acc += movs.filter((x) => x.itemId === itemId && IN.has(x.type) && ym(x.date) === m).reduce((s, x) => s + x.quantity * x.unitCost, 0); return { month: m.slice(5), cost: Math.round(acc) }; });
}
export function consumption(movs: RawMov[], itemId: string, now: Date) {
  const cm = now.toISOString().slice(0, 7);
  const sum = (m: string) => movs.filter((x) => x.itemId === itemId && OUT.has(x.type) && ym(x.date) === m).reduce((s, x) => s + x.quantity, 0);
  const avg = months(4, now).slice(0, 3).reduce((s, m) => s + sum(m), 0) / 3;
  const cur = sum(cm);
  return { cur, avg, high: avg > 0 && cur > 2 * avg };
}
export function slowIds(movs: RawMov[], items: readonly InventoryItem[], now: Date, days = 30) {
  const cut = new Date(now.getTime() - days * 864e5).toISOString().slice(0, 10);
  const lastOut = new Map<string, string>();
  movs.filter((x) => OUT.has(x.type)).forEach((x) => { const p = lastOut.get(x.itemId); if (!p || x.date > p) lastOut.set(x.itemId, x.date); });
  return new Set(items.filter((i) => { const d = lastOut.get(i.id); return !d || d < cut; }).map((i) => i.id));
}
export function highIds(movs: RawMov[], items: readonly InventoryItem[], now: Date) {
  return new Set(items.filter((i) => consumption(movs, i.id, now).high).map((i) => i.id));
}
