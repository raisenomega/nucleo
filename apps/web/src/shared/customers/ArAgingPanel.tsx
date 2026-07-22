import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@shared/lib/format";
import { getArAging, type ArAging } from "@shared/customers/ar.repository";
import { AR_BUCKETS } from "@shared/customers/ar-ui";

// Cartera de cuentas por cobrar del tenant: buckets de aging + clientes con deuda (ordenados por monto).
export function ArAgingPanel() {
  const [ag, setAg] = useState<ArAging | null>(null);
  useEffect(() => { void getArAging().then(setAg); }, []);
  if (!ag) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">Cartera por cobrar</h2>
        <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{formatCurrency(ag.totalOutstanding)}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {AR_BUCKETS.map(([key, label, color]) => (
          <div key={key} className={`rounded-lg border border-border p-3 ${color}`}>
            <p className="text-[10px] font-bold uppercase opacity-80">{label}</p>
            <p className="text-base font-bold">{formatCurrency(ag.buckets[key])}</p>
          </div>))}
      </div>
      {ag.byCustomer.length === 0
        ? <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">Sin cuentas por cobrar. 🎉</p>
        : <div className="overflow-hidden rounded-lg border border-border bg-card">
            {ag.byCustomer.map((c) => (
              <div key={c.customerId ?? c.customerName} className="flex items-center justify-between border-b border-border px-4 py-2 text-sm last:border-0">
                {c.customerId
                  ? <Link to="/customers" search={{ view: c.customerId }} className="font-medium text-primary hover:underline">{c.customerName}</Link>
                  : <span className="font-medium text-foreground">{c.customerName}</span>}
                <span className="font-bold text-red-600">{formatCurrency(c.outstanding)}</span>
              </div>))}
          </div>}
    </div>
  );
}
