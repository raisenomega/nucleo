import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PaymentMethod } from "@orders/domain/order.types";

export function ConfirmPaymentModal({ methods, busy, onConfirm, onClose }: {
  methods: PaymentMethod[]; busy: boolean; onConfirm: (pmId: string | null, createInvoice: boolean) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [pm, setPm] = useState("");
  const [inv, setInv] = useState(true);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("ordConfirmTitle")}</h2>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ordConfirmMethod")}</span>
          <select value={pm} onChange={(e) => setPm(e.target.value)} className={fld}>
            <option value="">{t("ordConfirmMethodAuto")}</option>
            {methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={inv} onChange={(e) => setInv(e.target.checked)} className="h-4 w-4" />
          {t("ordConfirmCreateInvoice")}</label>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => onConfirm(pm || null, inv)} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("ordConfirmBtn")}</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
