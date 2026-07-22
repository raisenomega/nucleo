import { Download } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { CustomerInvoice } from "@shared/portal/order.types";

// Fila de factura: número + vencimiento + total + estado (pagada/pendiente/vencida) + descargar PDF (si existe).
export function InvoiceCard({ invoice }: { invoice: CustomerInvoice }) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = invoice.status !== "paid" && !!invoice.dueDate && invoice.dueDate < today;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <span>
        <span className="font-bold text-foreground">{invoice.invoiceNumber || "—"}</span>
        <span className="block text-xs text-muted-foreground">{invoice.dueDate ? `${t("pDueDate")}: ${invoice.dueDate}` : ""}</span>
        {invoice.status !== "paid" && invoice.amountPaid > 0 && <span className="block text-xs font-bold text-amber-600">Pagado {formatCurrency(invoice.amountPaid)} · Balance {formatCurrency(invoice.balance)}</span>}
      </span>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{formatCurrency(invoice.total)}</span>
        {overdue ? <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-bold text-destructive">{t("pOverdue")}</span>
          : <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${invoice.status === "paid" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}`}>{t(invoice.status === "paid" ? "pPaid" : "pPending")}</span>}
        {invoice.pdfUrl ? <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={t("downloadPdf")} className="text-primary"><Download className="h-4 w-4" /></a>
          : <span title={t("pPdfUnavailable")} className="text-muted-foreground opacity-40"><Download className="h-4 w-4" /></span>}
      </span>
    </div>
  );
}
