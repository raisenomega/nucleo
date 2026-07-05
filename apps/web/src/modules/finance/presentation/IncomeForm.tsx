import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { IncomeFormData } from "@finance/domain/income.types";

type Cat = { id: string; label: string };

export function IncomeForm({ incomeCats, payCats, initial, onSubmit, onCancel }: {
  incomeCats: Cat[]; payCats: Cat[];
  initial?: IncomeFormData;
  onSubmit: (d: IncomeFormData) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<IncomeFormData>(
    initial ?? { categoryId: "", amount: 0, description: "", date: "", paymentMethodId: "" },
  );
  const field = "w-full rounded-lg bg-secondary text-foreground p-2 font-body";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}
      className="space-y-2 rounded-lg border border-secondary p-4">
      <input type="number" step="0.01" value={f.amount || ""} placeholder={t("amount")}
        onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className={field} />
      <select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} className={field}>
        <option value="">{t("category")}</option>
        {incomeCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <input value={f.description} placeholder={t("description")}
        onChange={(e) => setF({ ...f, description: e.target.value })} className={field} />
      <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} />
      <select value={f.paymentMethodId} onChange={(e) => setF({ ...f, paymentMethodId: e.target.value })} className={field}>
        <option value="">{t("paymentMethod")}</option>
        {payCats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
