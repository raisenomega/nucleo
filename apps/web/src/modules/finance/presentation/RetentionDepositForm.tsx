import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { RetentionDepositFormData } from "@finance/domain/reconciliation.types";

export function RetentionDepositForm({ onSubmit, onCancel }: {
  onSubmit: (d: RetentionDepositFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<RetentionDepositFormData>({ amount: 0, depositDate: new Date().toISOString().slice(0, 10), notes: "" });
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="font-body font-bold">{t("registerDeposit")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1"><span className={lbl}>{t("amount")}</span>
            <input type="number" step="0.01" min="0" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className={field} required /></label>
          <label className="space-y-1"><span className={lbl}>{t("date")}</span>
            <input type="date" value={f.depositDate} onChange={(e) => setF({ ...f, depositDate: e.target.value })} className={field} /></label>
        </div>
        <label className="block space-y-1"><span className={lbl}>{t("notes")}</span>
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={field} /></label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
}
