import { useEffect, useState } from "react";
import { Wallet, MapPin } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import { getCustomerAr, type CustomerAr } from "@shared/customers/ar.repository";
import { AR_BUCKET_LABEL, AR_BUCKET_COLOR } from "@shared/customers/ar-ui";

// Estado de cuenta UNIFICADO (2.4b): facturas impagas + servicios de ruta pendientes = total adeudado por cliente.
export function CustomerStatement({ customerId }: { customerId: string }) {
  const [ar, setAr] = useState<CustomerAr | null>(null);
  useEffect(() => { void getCustomerAr(customerId).then(setAr); }, [customerId]);
  if (!ar) return null;
  const th = "px-2 py-1.5 text-left font-bold";
  const fd = ar.fieldDebt;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Wallet className="h-4 w-4" />Estado de cuenta</h3>
        <div className="text-right"><p className="text-xs text-muted-foreground">Total adeudado</p>
          <p className={`text-lg font-bold ${ar.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(ar.totalDue)}</p>
          {fd.total > 0 && <p className="text-[10px] text-muted-foreground">Facturas {formatCurrency(ar.totalOutstanding)} · Servicios {formatCurrency(fd.total)}</p>}</div>
      </div>
      {ar.invoices.length === 0
        ? <p className="py-2 text-center text-sm text-muted-foreground">Sin facturas.</p>
        : <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead className="bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className={th}>Factura</th><th className={th}>Emisión</th><th className={th}>Vence</th><th className={`${th} text-right`}>Total</th><th className={th}>Aging</th></tr></thead>
            <tbody>{ar.invoices.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-2 py-1.5 font-mono">{i.invoiceNumber ?? "—"}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{i.invoiceDate || "—"}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{i.dueDate ?? "—"}{i.daysOverdue > 0 && <span className="ml-1 font-bold text-red-600">(+{i.daysOverdue}d)</span>}</td>
                <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(i.total)}</td>
                <td className="px-2 py-1.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${AR_BUCKET_COLOR[i.bucket] ?? ""}`}>{AR_BUCKET_LABEL[i.bucket] ?? i.bucket}</span></td>
              </tr>))}</tbody>
          </table></div>}
      {fd.stops.length > 0 && (
        <div className="space-y-1 border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1 text-xs font-bold text-foreground"><MapPin className="h-3.5 w-3.5" />Servicios pendientes de cobro</h4>
            <span className="text-xs font-bold text-red-600">{formatCurrency(fd.total)}</span>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead className="bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className={th}>Fecha</th><th className={th}>Servicio</th><th className={th}>Dirección</th><th className={th}>Asignado</th><th className={`${th} text-right`}>Monto</th></tr></thead>
            <tbody>{fd.stops.map((f) => (
              <tr key={f.stopId} className="border-t border-border">
                <td className="px-2 py-1.5 text-muted-foreground">{f.routeDate}</td>
                <td className="px-2 py-1.5">{f.serviceType || "—"}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{f.address || "—"}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{f.assignedTo}</td>
                <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(f.amount)}</td>
              </tr>))}</tbody>
          </table></div>
        </div>)}
    </div>
  );
}
