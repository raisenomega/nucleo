import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { RecurringExpenseFormData, RecurringFrequency } from "@finance/domain/recurring-expense.types";

const FREQ: RecurringFrequency[] = ["monthly", "quarterly", "annual"];
const EMPTY: RecurringExpenseFormData = { categoryId: "", label: "", budgetedAmount: 0, frequency: "monthly" };

export function RecurringExpenseForm({ initial, onSubmit, onCancel }: {
  initial?: RecurringExpenseFormData;
  onSubmit: (d: RecurringExpenseFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<RecurringExpenseFormData>(initial ?? EMPTY);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="font-body font-bold">{t("addRecurring")}</h2>
        <CategoryPicker kind="expense" gateModule="recurring" value={f.categoryId} onChange={(id) => setF({ ...f, categoryId: id })} label="category" />
        <label className="block space-y-1"><span className={lbl}>{t("description")}</span>
          <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} className={field} required /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1"><span className={lbl}>{t("budgeted")}</span>
            <input type="number" step="0.01" min="0" value={f.budgetedAmount || ""} onChange={(e) => setF({ ...f, budgetedAmount: Number(e.target.value) })} className={field} /></label>
          <label className="space-y-1"><span className={lbl}>{t("frequencyLabel")}</span>
            <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value as RecurringFrequency })} className={field}>
              {FREQ.map((fr) => <option key={fr} value={fr}>{t(fr)}</option>)}
            </select></label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
}
