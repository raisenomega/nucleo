import type { VendorBill, ApAgingBucket } from "@accounting/domain/vendor-bill.types";

// Envejecimiento AP calculado client-side desde los bills abiertos (el RPC no da buckets por proveedor).
const OPEN: string[] = ["pending", "approved", "partially_paid", "disputed"];
type Acc = { supplierId: string; supplierName: string; current: number; b1_30: number; b31_60: number; b61_90: number; b90_plus: number; total: number };

export function buildApAging(bills: readonly VendorBill[]): ApAgingBucket[] {
  const map = new Map<string, Acc>();
  for (const b of bills) {
    if (!OPEN.includes(b.status) || b.balance <= 0) continue;
    const a = map.get(b.supplierId) ?? { supplierId: b.supplierId, supplierName: b.supplierName, current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0, total: 0 };
    const d = b.daysOverdue;
    if (d <= 0) a.current += b.balance;
    else if (d <= 30) a.b1_30 += b.balance;
    else if (d <= 60) a.b31_60 += b.balance;
    else if (d <= 90) a.b61_90 += b.balance;
    else a.b90_plus += b.balance;
    a.total += b.balance;
    map.set(b.supplierId, a);
  }
  return [...map.values()].sort((x, y) => y.total - x.total);
}

export function agingTotals(rows: readonly ApAgingBucket[]): ApAgingBucket {
  return rows.reduce((t, r) => ({ ...t, current: t.current + r.current, b1_30: t.b1_30 + r.b1_30,
    b31_60: t.b31_60 + r.b31_60, b61_90: t.b61_90 + r.b61_90, b90_plus: t.b90_plus + r.b90_plus, total: t.total + r.total }),
    { supplierId: "", supplierName: "", current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0, total: 0 });
}
