import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
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
  const field = "h-12 w-full rounded-lg border border-border bg-background px-3 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-primary">{t("addRecurring")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <CategoryPicker kind="expense" value={f.categoryId} onChange={(id) => setF({ ...f, categoryId: id })} label="category" />
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
        <div className="mt-auto flex gap-2">
          <button type="submit" className="min-h-[48px] flex-1 rounded-lg bg-primary text-primary-foreground px-4 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="min-h-[48px] rounded-lg bg-secondary text-foreground px-4 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
