import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { ORDER_STATUSES, type OrderStatus } from "@orders/domain/order.types";
import { STATUS_LABEL } from "@orders/presentation/order-status.const";

export function ChangeStatusModal({ current, busy, onConfirm, onClose }: {
  current: OrderStatus; busy: boolean; onConfirm: (s: OrderStatus, note: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<OrderStatus>(current);
  const [note, setNote] = useState("");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("ordChangeTitle")}</h2>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ordChangeNewStatus")}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={fld}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ordChangeNote")}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={fld} /></label>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => onConfirm(status, note)} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("ordChangeBtn")}</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
