import { formatCurrency } from "@shared/lib/format";
import { AR_BUCKETS } from "@shared/customers/ar-ui";
import type { CustomerAr } from "@shared/customers/ar.repository";

// Resumen de envejecimiento por cliente: chips por bucket (corriente→90+) + badge de salud de la cartera.
const H = { ok: "bg-green-500/10 text-green-600", light: "bg-yellow-500/10 text-yellow-600", grave: "bg-red-500/10 text-red-600", risk: "bg-red-700/10 text-red-700" };

export function CustomerArSummary({ ar }: { ar: CustomerAr }) {
  const bk = { current: 0, b1_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0 };
  for (const i of ar.invoices) { const k = i.bucket as keyof typeof bk; if (k in bk) bk[k] += i.balance; }
  const severe = bk.b31_60 + bk.b61_90 + bk.b90_plus;
  const overdue = bk.b1_30 + severe;
  const health = ar.totalOutstanding === 0 ? { l: "Sin deuda", c: H.ok }
    : bk.current === 0 && overdue > 0 ? { l: "Cuenta en riesgo", c: H.risk }
    : severe > 0 ? { l: "Mora grave", c: H.grave }
    : overdue > 0 ? { l: "Leve mora", c: H.light }
    : { l: "Al día", c: H.ok };
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">Envejecimiento</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${health.c}`}>{health.l}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {AR_BUCKETS.map(([key, label, cls]) => (
          <div key={key} className={`rounded-lg p-1.5 text-center ${bk[key] > 0 ? cls : "bg-secondary text-muted-foreground"}`}>
            <p className="text-[9px] font-bold uppercase leading-tight">{label}</p>
            <p className="text-xs font-bold">{formatCurrency(bk[key])}</p>
          </div>))}
      </div>
      {ar.fieldDebt.total > 0 && <p className="text-[10px] text-muted-foreground">Deuda facturación {formatCurrency(ar.totalOutstanding)} · Deuda servicio {formatCurrency(ar.fieldDebt.total)}</p>}
    </div>
  );
}
