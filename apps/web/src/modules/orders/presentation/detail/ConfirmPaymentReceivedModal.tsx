import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

export function ConfirmPaymentReceivedModal({ busy, onConfirm, onClose }: {
  busy: boolean; onConfirm: (note: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [verified, setVerified] = useState(false);
  const [note, setNote] = useState("");
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("ordConfirmReceivedTitle")}</h2>
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-1 h-4 w-4" />
          <span>{t("ordConfirmReceivedCheck")}</span>
        </label>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ordChangeNote")}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background p-2 text-sm" /></label>
        <div className="flex gap-2">
          <button type="button" disabled={busy || !verified} onClick={() => onConfirm(note)} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("ordActionConfirm")}</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
