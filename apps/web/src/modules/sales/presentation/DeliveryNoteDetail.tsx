import { X, PackageCheck, Truck, FileDown, Send, FileOutput, Ban } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { LinkedCustomerBadge } from "@shared/components/LinkedCustomerBadge";
import { DeliveryEvidence } from "@sales/presentation/DeliveryEvidence";
import { DN_ST_KEY, DN_ST_COLOR } from "@sales/presentation/delivery-note-ui";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

export function DeliveryNoteDetail({ note, canManage, warehouses, onDispatch, onDeliver, onCancel, onInvoice, onPdf, onShare, onClose }: {
  note: DeliveryNote; canManage: boolean; warehouses: Record<string, string>;
  onDispatch: () => void; onDeliver: () => void; onCancel: () => void; onInvoice: () => void; onPdf: () => void; onShare: () => void; onClose: () => void;
}) {
  const { t } = useI18n(); const d = note;
  const btn = "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold";
  const done = d.status === "dispatched" || d.status === "delivered";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{d.customerName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs">{d.noteNumber}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${DN_ST_COLOR[d.status]}`}>{t(DN_ST_KEY[d.status])}</span>
          {d.salesOrderNumber && <span className="text-xs text-muted-foreground">← {d.salesOrderNumber}</span>}
        </div>
        <LinkedCustomerBadge customerId={d.customerId} name={d.customerName} className="text-sm" />
        {d.shippingAddress && <p className="text-sm"><span className="font-bold">{t("shippingAddress")}: </span>{d.shippingAddress}</p>}
        <table className="w-full text-xs"><thead><tr className="border-b border-border text-muted-foreground">
          <th className="p-1 text-left font-medium">{t("description")}</th><th className="p-1 text-right">{t("qtyDispatched")}</th><th className="p-1 text-left">{t("warehouse")}</th><th className="p-1 text-left">{t("lot")}</th></tr></thead>
          <tbody>{d.items.map((i) => (
            <tr key={i.id} className="border-b border-border"><td className="p-1">{i.description}</td><td className="p-1 text-right">{i.qtyDispatched}</td>
              <td className="p-1">{i.warehouseId ? warehouses[i.warehouseId] ?? "—" : "—"}</td><td className="p-1">{i.lotId ? "✓" : "—"}</td></tr>))}</tbody></table>
        {done && (d.receivedBy || d.signatureData || d.evidencePhotos.length > 0) && <div className="space-y-1">
          {d.receivedBy && <p className="text-sm"><span className="font-bold">{t("receivedBy")}: </span>{d.receivedBy}</p>}
          <DeliveryEvidence signature={d.signatureData} photos={d.evidencePhotos} /></div>}
        {canManage && <div className="flex flex-wrap gap-2">
          {d.status === "draft" && <button type="button" onClick={onDispatch} className={`${btn} bg-primary text-primary-foreground`}><PackageCheck className="h-4 w-4" /> {t("dispatch")}</button>}
          {(d.status === "dispatched" || d.status === "in_transit") && <button type="button" onClick={onDeliver} className={`${btn} bg-green-600 text-white`}><Truck className="h-4 w-4" /> {t("confirmDelivery")}</button>}
          {done && <button type="button" onClick={onPdf} className={`${btn} bg-secondary`}><FileDown className="h-4 w-4" /> {t("downloadPdf")}</button>}
          {done && <button type="button" onClick={onShare} className={`${btn} bg-secondary`}><Send className="h-4 w-4" /> {t("sendWhatsapp")}</button>}
          {done && <button type="button" onClick={onInvoice} className={`${btn} bg-secondary`}><FileOutput className="h-4 w-4" /> {t("createInvoice")}</button>}
          {d.status === "draft" && <button type="button" onClick={onCancel} className={`${btn} bg-destructive text-white`}><Ban className="h-4 w-4" /> {t("cancelOrder")}</button>}
        </div>}
      </div>
    </ScreenModal>
  );
}
