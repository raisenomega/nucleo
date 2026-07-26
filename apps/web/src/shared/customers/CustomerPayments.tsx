import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import { listCustomerPayments, type CustomerPayment } from "@shared/customers/customer-payments.repository";

// Historial de pagos del cliente (cross-factura). Factura clickable → detalle. KPIs: total cobrado / último / este mes.
export function CustomerPayments({ tenantId, customerId, email }: { tenantId: string; customerId: string; email: string }) {
  const [pays, setPays] = useState<CustomerPayment[]>([]);
  const [all, setAll] = useState(false);
  useEffect(() => { void listCustomerPayments(tenantId, customerId, email).then(setPays); }, [tenantId, customerId, email]);
  const totalPaid = useMemo(() => pays.reduce((s, p) => s + p.amount, 0), [pays]);
  const thisMonth = useMemo(() => { const m = new Date().toISOString().slice(0, 7); return pays.filter((p) => p.paymentDate.startsWith(m)).length; }, [pays]);
  const shown = all ? pays : pays.slice(0, 20);
  const th = "px-2 py-1.5 text-left font-bold";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Receipt className="h-4 w-4" />Historial de pagos</h3>
      {pays.length === 0 ? <p className="py-2 text-center text-sm text-muted-foreground">Sin pagos registrados.</p> : <>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-secondary p-2"><p className="text-[10px] text-muted-foreground">Total cobrado</p><p className="font-bold text-green-600">{formatCurrency(totalPaid)}</p></div>
          <div className="rounded-lg bg-secondary p-2"><p className="text-[10px] text-muted-foreground">Último pago</p><p className="font-bold text-foreground">{pays[0]?.paymentDate ?? "—"}</p></div>
          <div className="rounded-lg bg-secondary p-2"><p className="text-[10px] text-muted-foreground">Este mes</p><p className="font-bold text-foreground">{thisMonth}</p></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead className="bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className={th}>Fecha</th><th className={th}>Factura</th><th className={`${th} text-right`}>Monto</th><th className={th}>Método</th><th className={th}>Ref.</th></tr></thead>
          <tbody>{shown.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-2 py-1.5 text-muted-foreground">{p.paymentDate}</td>
              <td className="px-2 py-1.5 font-mono"><Link to="/billing" search={{ invoice: p.invoiceId }} className="text-primary hover:underline">{p.invoiceNumber}</Link></td>
              <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(p.amount)}</td>
              <td className="px-2 py-1.5">{p.method ?? "—"}</td>
              <td className="px-2 py-1.5 text-muted-foreground">{p.reference || "—"}</td>
            </tr>))}</tbody>
        </table></div>
        {pays.length > 20 && <button type="button" onClick={() => setAll((v) => !v)} className="text-xs font-bold text-primary">{all ? "Ver menos" : `Ver todos (${pays.length})`}</button>}
      </>}
    </div>
  );
}
