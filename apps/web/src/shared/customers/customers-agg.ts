import type { CustomerBase, OrderLite, ReviewLite, InvoiceLite } from "@shared/customers/customer-crm.repository";

// Agregación pura por cliente (órdenes/facturado/última orden/rating/deuda) + KPIs.
export interface AdminCustomer extends CustomerBase { ordersCount: number; totalBilled: number; lastOrderAt: string | null; avgRating: number; debt: number }
export interface CustomerKpis { total: number; active30: number; totalBilled: number; avgRating: number }
const isPaid = (st: string) => st === "paid";

export function aggregate(customers: CustomerBase[], orders: OrderLite[], reviews: ReviewLite[], invoices: InvoiceLite[], now: number): { rows: AdminCustomer[]; kpis: CustomerKpis } {
  const rows: AdminCustomer[] = customers.map((c) => {
    const os = orders.filter((o) => o.email && o.email === c.email);
    const rs = reviews.filter((r) => r.profileId === c.id);
    const iv = invoices.filter((i) => i.email && i.email === c.email);
    const lastOrderAt = os.map((o) => o.createdAt).sort().at(-1) ?? null;
    return {
      ...c, ordersCount: os.length,
      totalBilled: os.filter((o) => isPaid(o.status)).reduce((sm, o) => sm + o.total, 0),
      lastOrderAt, avgRating: rs.length ? rs.reduce((sm, r) => sm + r.rating, 0) / rs.length : 0,
      debt: iv.filter((i) => !isPaid(i.status)).reduce((sm, i) => sm + i.total, 0),
    };
  });
  const active30 = rows.filter((r) => r.lastOrderAt && now - new Date(r.lastOrderAt).getTime() < 30 * 864e5).length;
  const kpis: CustomerKpis = {
    total: customers.length, active30,
    totalBilled: rows.reduce((sm, r) => sm + r.totalBilled, 0),
    avgRating: reviews.length ? reviews.reduce((sm, r) => sm + r.rating, 0) / reviews.length : 0,
  };
  return { rows, kpis };
}
