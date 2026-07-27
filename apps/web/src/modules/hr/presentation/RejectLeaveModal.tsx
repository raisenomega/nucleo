import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

export function RejectLeaveModal({ onReject, onClose }: { onReject: (reason: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("reject")}</h2>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("rejectionReason")} rows={3} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => { onReject(reason); onClose(); }} className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-white">{t("reject")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
