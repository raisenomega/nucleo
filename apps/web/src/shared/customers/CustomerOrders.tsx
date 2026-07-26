import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import { listCustomerOrders, type CustomerOrder } from "@shared/customers/customer-orders.repository";

// Órdenes del cliente con detalle: qué compró (items), cómo pagó, origen web/directo, estado. Nº → detalle de orden.
const stCls = (st: string) => ["paid", "delivered", "completed"].includes(st) ? "bg-green-500/10 text-green-600"
  : ["canceled", "cancelled", "refunded"].includes(st) ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600";

export function CustomerOrders({ tenantId, customerId, email }: { tenantId: string; customerId: string; email: string }) {
  const [ords, setOrds] = useState<CustomerOrder[]>([]);
  const [all, setAll] = useState(false);
  useEffect(() => { void listCustomerOrders(tenantId, customerId, email).then(setOrds); }, [tenantId, customerId, email]);
  const total = useMemo(() => ords.reduce((s, o) => s + o.total, 0), [ords]);
  const shown = all ? ords : ords.slice(0, 20);
  const th = "px-2 py-1.5 text-left font-bold";
  const kpi = (label: string, val: string, cls = "text-foreground") => <div className="rounded-lg bg-secondary p-2"><p className="text-[10px] text-muted-foreground">{label}</p><p className={`font-bold ${cls}`}>{val}</p></div>;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><ShoppingBag className="h-4 w-4" />Órdenes</h3>
      {ords.length === 0 ? <p className="py-2 text-center text-sm text-muted-foreground">Sin órdenes.</p> : <>
        <div className="grid grid-cols-4 gap-2 text-center">
          {kpi("Órdenes", String(ords.length))}{kpi("Total gastado", formatCurrency(total), "text-green-600")}
          {kpi("Ticket prom.", formatCurrency(ords.length ? total / ords.length : 0))}{kpi("Última", ords[0]?.createdAt.slice(0, 10) ?? "—")}
        </div>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead className="bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className={th}>Fecha</th><th className={th}>Nº</th><th className={th}>Items</th><th className={`${th} text-right`}>Total</th><th className={th}>Pago</th><th className={th}>Origen</th><th className={th}>Estado</th></tr></thead>
          <tbody>{shown.map((o) => { const names = o.items.map((i) => `${i.name} ×${i.qty}`).join(", ");
            return (
              <tr key={o.id} className="border-t border-border">
                <td className="px-2 py-1.5 text-muted-foreground">{o.createdAt.slice(0, 10)}</td>
                <td className="px-2 py-1.5 font-mono"><Link to="/orders/$orderId" params={{ orderId: o.id }} className="text-primary hover:underline">{o.orderNumber || "—"}</Link></td>
                <td className="max-w-[10rem] truncate px-2 py-1.5" title={names}>{names || "—"}</td>
                <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(o.total)}</td>
                <td className="px-2 py-1.5">{o.paymentMethod ?? "—"}</td>
                <td className="px-2 py-1.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${o.source ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"}`}>{o.source ? "Web" : "Directo"}</span></td>
                <td className="px-2 py-1.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${stCls(o.status)}`}>{o.status}</span></td>
              </tr>); })}</tbody>
        </table></div>
        {ords.length > 20 && <button type="button" onClick={() => setAll((v) => !v)} className="text-xs font-bold text-primary">{all ? "Ver menos" : `Ver todas (${ords.length})`}</button>}
      </>}
    </div>
  );
}
