import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@shared/lib/format";
import { AR_BUCKET_LABEL, AR_BUCKET_COLOR } from "@shared/customers/ar-ui";
import type { ArInvoice } from "@shared/customers/ar.repository";

// Tabla de facturas del estado de cuenta. R8-T2: separa visualmente vencidas de corrientes cuando hay mezcla.
const th = "px-2 py-1.5 text-left font-bold";

function Row({ i }: { i: ArInvoice }) {
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-1.5 font-mono"><Link to="/billing" search={{ invoice: i.id }} className="text-primary hover:underline">{i.invoiceNumber ?? "—"}</Link></td>
      <td className="px-2 py-1.5 text-muted-foreground">{i.invoiceDate || "—"}</td>
      <td className="px-2 py-1.5 text-muted-foreground">{i.dueDate ?? "—"}{i.daysOverdue > 0 && <span className="ml-1 font-bold text-red-600">(+{i.daysOverdue}d)</span>}</td>
      <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(i.total)}</td>
      <td className="px-2 py-1.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${AR_BUCKET_COLOR[i.bucket] ?? ""}`}>{AR_BUCKET_LABEL[i.bucket] ?? i.bucket}</span></td>
    </tr>
  );
}

function Group({ label, cls, rows }: { label: string; cls: string; rows: ArInvoice[] }) {
  return (
    <>
      <tr><td colSpan={5} className={`px-2 pb-1 pt-3 text-xs font-bold ${cls}`}>{label} ({rows.length})</td></tr>
      {rows.map((i) => <Row key={i.id} i={i} />)}
    </>
  );
}

export function CustomerInvoiceTable({ invoices }: { invoices: ArInvoice[] }) {
  const overdue = invoices.filter((i) => i.daysOverdue > 0 && i.balance > 0);
  const current = invoices.filter((i) => !(i.daysOverdue > 0 && i.balance > 0));
  const split = overdue.length > 0 && current.length > 0;
  return (
    <div className="overflow-x-auto"><table className="w-full text-xs">
      <thead className="bg-secondary text-[10px] uppercase text-muted-foreground"><tr><th className={th}>Factura</th><th className={th}>Emisión</th><th className={th}>Vence</th><th className={`${th} text-right`}>Total</th><th className={th}>Aging</th></tr></thead>
      <tbody>
        {split
          ? <><Group label="Facturas vencidas" cls="text-red-600" rows={overdue} /><Group label="Facturas corrientes" cls="text-green-600" rows={current} /></>
          : invoices.map((i) => <Row key={i.id} i={i} />)}
      </tbody>
    </table></div>
  );
}
