import { useState } from "react";
import { useI18n } from "@shared/i18n";

// Modal de motivo obligatorio para VOID (min 3, max 500). Reusable en ingresos/gastos/rutas.
export function VoidModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const ok = reason.trim().length >= 3;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-primary">{t("voidTitle")}</h3>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-muted-foreground">{t("voidReasonLabel")}</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} rows={3}
            placeholder={t("voidReasonPlaceholder")} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("voidCancelBtn")}</button>
          <button type="button" disabled={!ok} onClick={() => onConfirm(reason.trim())}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{t("voidConfirmBtn")}</button>
        </div>
      </div>
    </div>
  );
}
