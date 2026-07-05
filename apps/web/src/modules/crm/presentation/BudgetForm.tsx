import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { BudgetFormData } from "@crm/domain/marketing.types";

export function BudgetForm({ initial, onSubmit, onCancel }: {
  initial?: BudgetFormData; onSubmit: (d: BudgetFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<BudgetFormData>(initial ?? { month: "", channel: "", budgetedAmount: 0, notes: "" });
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newBudget")}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className="space-y-1"><span className={lbl}>{t("month")}</span>
          <input type="month" value={f.month.slice(0, 7)}
            onChange={(e) => setF({ ...f, month: e.target.value ? `${e.target.value}-01` : "" })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("channel")}</span>
          <input value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("budgetedAmount")}</span>
          <input type="number" step="0.01" min="0" value={f.budgetedAmount || ""}
            onChange={(e) => setF({ ...f, budgetedAmount: Number(e.target.value) })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("notes")}</span>
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={field} /></label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
