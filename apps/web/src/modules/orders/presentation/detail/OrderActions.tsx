import { Link } from "@tanstack/react-router";
import { FileDown, MessageCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfShare } from "@shared/hooks/usePdfShare";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { orderDoc } from "@orders/presentation/pdf/order-pdf";
import { OrderStatusBadge } from "@orders/presentation/list/OrderStatusBadge";
import type { Order } from "@orders/domain/order.types";

const TERMINAL = ["paid", "refunded", "canceled"];

export function OrderActions({ order, onChangeStatus, onConfirm, onConfirmReceived, onReportNotReceived }: {
  order: Order; onChangeStatus: () => void; onConfirm: () => void; onConfirmReceived: () => void; onReportNotReceived: () => void;
}) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const { sharing, sharePdf } = usePdfShare();
  const brand = usePdfBrand();
  const awaiting = order.status === "awaiting_confirmation";
  async function waSend() {
    const url = await sharePdf(() => orderDoc(order, brand, t), `order/${order.id}-${Date.now()}.pdf`);
    window.open(`https://wa.me/${(order.customerPhone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(`${t("docOrder")} ${order.orderNumber ?? ""}${url ? `\n${url}` : ""}`)}`, "_blank", "noopener");
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
        {order.customerPhone && <button type="button" disabled={sharing} onClick={() => void waSend()} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><MessageCircle className="h-4 w-4" />{sharing ? t("generatingPdf") : t("whatsapp")}</button>}
      </div>
      <div className="space-y-1.5 border-t border-border pt-3">
        {linked(t("ordLinkedInvoice"), "/billing", order.linkedInvoiceId)}
        {linked(t("ordLinkedLead"), "/leads", order.linkedLeadId)}
      </div>
    </aside>
  );
}
