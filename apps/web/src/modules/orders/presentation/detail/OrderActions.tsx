import { Link } from "@tanstack/react-router";
import { FileDown, MessageCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { orderDoc } from "@orders/presentation/pdf/order-pdf";
import { getOrderShareUrl } from "@orders/infrastructure/supabase-order-share.repository";
import { shareViaWhatsApp, docWaMessage } from "@shared/lib/share-whatsapp";
import { OrderStatusBadge } from "@orders/presentation/list/OrderStatusBadge";
import type { Order } from "@orders/domain/order.types";

const TERMINAL = ["paid", "refunded", "canceled"];

export function OrderActions({ order, onChangeStatus, onConfirm, onConfirmReceived, onReportNotReceived }: {
  order: Order; onChangeStatus: () => void; onConfirm: () => void; onConfirmReceived: () => void; onReportNotReceived: () => void;
}) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const brand = usePdfBrand();
  const awaiting = order.status === "awaiting_confirmation";
  // WhatsApp: link branded a /orden/{token} (preview del dominio del tenant, no URL cruda de Storage).
  async function waSend() {
    const url = await getOrderShareUrl(order.id);
    shareViaWhatsApp(order.customerPhone, docWaMessage(`${t("docOrder")} ${order.orderNumber ?? ""} — $${order.total.toFixed(2)}`, t("viewOrder"), url));
  }
  const linked = (label: string, to: "/billing" | "/leads", id: string | null) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {id ? <Link to={to} className="text-foreground underline">{t("ordActionView")}</Link> : <span className="text-muted-foreground">—</span>}
    </div>
  );
  return (
    <aside className="h-fit space-y-3 rounded-lg border border-border p-4 md:sticky md:top-4">
      <div><OrderStatusBadge status={order.status} large /></div>
      {awaiting ? (
        <>
          <button type="button" onClick={onConfirmReceived} className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("ordActionConfirmReceived")}</button>
          <button type="button" onClick={onReportNotReceived} className="w-full rounded-lg border border-destructive px-4 py-2 font-medium text-destructive">{t("ordActionReport")}</button>
        </>
      ) : (
        !TERMINAL.includes(order.status) && (
          <button type="button" onClick={onConfirm} className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("ordActionConfirm")}</button>
        )
      )}
      <button type="button" onClick={onChangeStatus} className="w-full rounded-lg border border-border px-4 py-2 text-foreground">{t("ordActionChangeStatus")}</button>
      <div className="flex gap-2 border-t border-border pt-3">
        <button type="button" disabled={generating} onClick={() => void exportPdf(() => orderDoc(order, brand, t))} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50"><FileDown className="h-4 w-4" />PDF</button>
        {order.customerPhone && <button type="button" onClick={() => void waSend()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" />{t("whatsapp")}</button>}
      </div>
      <div className="space-y-1.5 border-t border-border pt-3">
        {linked(t("ordLinkedInvoice"), "/billing", order.linkedInvoiceId)}
        {linked(t("ordLinkedLead"), "/leads", order.linkedLeadId)}
      </div>
    </aside>
  );
}
