import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

export function ReportNotReceivedModal({ busy, onSubmit, onClose }: {
  busy: boolean; onSubmit: (reason: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("ordReportTitle")}</h2>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("ordReportReason")}</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background p-2 text-sm" /></label>
        <div className="flex gap-2">
          <button type="button" disabled={busy || reason.trim().length < 3} onClick={() => onSubmit(reason.trim())} className="rounded-lg bg-destructive px-4 py-2 font-bold text-destructive-foreground disabled:opacity-50">{busy ? t("sending") : t("ordReportBtn")}</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-foreground">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
