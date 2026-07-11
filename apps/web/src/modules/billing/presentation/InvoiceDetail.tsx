import { X, Check, MessageCircle, Ban, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { INV_ST_KEY, INV_ST_COLOR } from "@billing/presentation/billing-ui";
import type { Invoice } from "@billing/domain/invoice.types";

const wa = (i: Invoice, msg: string) => `https://wa.me/${(i.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

// Detalle factura (ScreenModal): items + totales + [WhatsApp] [Marcar pagada] [Cancelar].
export function InvoiceDetail({ inv, canManage, onPay, onCancel, onClose }: {
  inv: Invoice; canManage: boolean; onPay: () => void; onCancel: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const pdf = usePdf();
  const open = inv.status !== "paid" && inv.status !== "cancelled";
  const msg = `${t("invoice")} ${inv.invoiceNumber ?? ""} — ${formatCurrency(inv.total)}`;
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{inv.clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs">{inv.invoiceNumber ?? "—"}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${INV_ST_COLOR[inv.status]}`}>{t(INV_ST_KEY[inv.status])}</span>
        </div>
        <div className="rounded-lg border border-border">
          {inv.items.map((it, idx) => (
            <div key={idx} className="flex justify-between border-b border-border px-3 py-1 text-sm last:border-0">
              <span>{it.description} ×{it.quantity}</span><span className="font-semibold">{formatCurrency(it.lineTotal)}</span></div>))}
          <div className="flex justify-between px-3 py-1 text-sm font-bold text-foreground"><span>{t("grandTotal")}</span><span>{formatCurrency(inv.total)}</span></div>
        </div>
        {inv.dueDate && <p className="text-sm"><span className="font-bold">{t("dueDate")}: </span>{inv.dueDate}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("invoice", inv.id)}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50"><FileDown className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("downloadPdf")}</button>
          {inv.phone && <a href={wa(inv, msg)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> {t("whatsapp")}</a>}
          {canManage && open && <button type="button" onClick={onPay} className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"><Check className="h-4 w-4" /> {t("markPaid")}</button>}
          {canManage && open && <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-white"><Ban className="h-4 w-4" /> {t("cancel")}</button>}
        </div>
      </div>
    </ScreenModal>
  );
}
