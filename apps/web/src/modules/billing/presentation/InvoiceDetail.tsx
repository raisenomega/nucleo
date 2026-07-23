import { useState } from "react";
import { X, MessageCircle, Ban, FileDown, DollarSign, Boxes } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { LinkedCustomerBadge } from "@shared/components/LinkedCustomerBadge";
import { INV_ST_KEY, INV_ST_COLOR } from "@billing/presentation/billing-ui";
import { useInvoicePayments } from "@billing/presentation/useInvoicePayments.hook";
import { PaymentDialog } from "@billing/presentation/PaymentDialog";
import { PaymentHistory } from "@billing/presentation/PaymentHistory";
import { SaleLinesList } from "@shared/components/SaleLinesList";
import { LineItemInventoryPanel } from "@fieldops/presentation/LineItemInventoryPanel";
import type { Invoice, InvoiceStatus } from "@billing/domain/invoice.types";

const wa = (i: Invoice, msg: string) => `https://wa.me/${(i.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

// Detalle factura: balance live (derivado de los pagos) + registrar pago parcial/total + historial (anular).
export function InvoiceDetail({ inv, canManage, onChanged, onCancel, onClose }: {
  inv: Invoice; canManage: boolean; onChanged: () => void; onCancel: () => void; onClose: () => void;
}) {
  const { t } = useI18n(); const pdf = usePdf(); const { can } = useModuleAccess();
  const pay = useInvoicePayments(inv.id); const [paying, setPaying] = useState(false); const [drillProduct, setDrillProduct] = useState<string | null>(null);
  const paid = pay.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.round((inv.total - paid) * 100) / 100;
  const st: InvoiceStatus = inv.status === "cancelled" ? "cancelled" : balance <= 0.01 ? "paid" : paid > 0.01 ? "partially_paid" : inv.status;
  const after = (e: string | null) => { if (e) window.alert(e); else onChanged(); };
  const voidP = (id: string) => { const r = window.prompt("Motivo de la anulación (mín. 3):"); if (r) void pay.void(id, r).then(after); };
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
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${INV_ST_COLOR[st]}`}>{t(INV_ST_KEY[st])}</span>
          {inv.stockDeductedAt && <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold text-green-600"><Boxes className="h-3 w-3" />Stock descontado {inv.stockDeductedAt.slice(0, 10)}</span>}
        </div>
        <LinkedCustomerBadge customerId={inv.customerId} name={inv.clientName} className="text-sm" />
        <SaleLinesList items={inv.items} canView={can("inventory", "view")} onLineClick={setDrillProduct} />
        <div className="rounded-lg border border-border p-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("pTotal") || "Total"}</span><span className="font-semibold">{formatCurrency(inv.total)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pagado</span><span className="font-semibold text-green-600">{formatCurrency(paid)}</span></div>
          <div className="flex justify-between text-sm font-bold"><span>Balance</span><span className={balance > 0.01 ? "text-red-600" : "text-green-600"}>{formatCurrency(balance)}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded bg-secondary"><div className="h-full bg-green-500" style={{ width: `${Math.min(100, (paid / (inv.total || 1)) * 100)}%` }} /></div>
        </div>
        <PaymentHistory payments={pay.payments} canVoid={canManage} onVoid={voidP} />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("invoice", inv.id)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50"><FileDown className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("downloadPdf")}</button>
          {inv.phone && <a href={wa(inv, msg)} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> {t("whatsapp")}</a>}
          {canManage && balance > 0.01 && st !== "cancelled" && <button type="button" onClick={() => setPaying(true)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><DollarSign className="h-4 w-4" /> Registrar pago</button>}
          {canManage && st !== "cancelled" && st !== "paid" && <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-white"><Ban className="h-4 w-4" /> {t("cancel")}</button>}
        </div>
      </div>
      {paying && <PaymentDialog invoiceId={inv.id} balance={balance} onClose={() => setPaying(false)} onSave={(p) => { setPaying(false); void pay.record(p).then(after); }} />}
      {drillProduct && <LineItemInventoryPanel productId={drillProduct} onClose={() => setDrillProduct(null)} />}
    </ScreenModal>
  );
}
