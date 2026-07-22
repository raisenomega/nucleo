import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@shared/lib/format";
import { getCustomerAr, type CustomerAr } from "@shared/customers/ar.repository";
import { AR_BUCKET_LABEL, AR_BUCKET_COLOR } from "@shared/customers/ar-ui";

// Estado de cuenta del cliente (AR por customer_id, no por email): total adeudado + facturas con aging.
export function CustomerStatement({ customerId }: { customerId: string }) {
  const [ar, setAr] = useState<CustomerAr | null>(null);
  useEffect(() => { void getCustomerAr(customerId).then(setAr); }, [customerId]);
  if (!ar) return null;
  const th = "px-2 py-1.5 text-left font-bold";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Wallet className="h-4 w-4" />Estado de cuenta</h3>
        <div className="text-right"><p className="text-xs text-muted-foreground">Total adeudado</p>
          <p className={`text-lg font-bold ${ar.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(ar.totalOutstanding)}</p></div>
      </div>
      {ar.invoices.length === 0
        ? <p className="py-3 text-center text-sm text-muted-foreground">Sin facturas.</p>
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
    </div>
  );
}
