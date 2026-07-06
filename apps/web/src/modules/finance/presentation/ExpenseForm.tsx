import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { ExpenseFormData } from "@finance/domain/expense.types";

type Cat = { id: string; label: string; expenseClass?: string | null };
type Emp = { id: string; full_name: string };

export function ExpenseForm({ expenseCats, payCats, employees, initial, onSubmit, onCancel }: {
  expenseCats: Cat[]; payCats: Cat[]; employees: Emp[];
  initial?: ExpenseFormData;
  onSubmit: (d: ExpenseFormData) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<ExpenseFormData>(
    initial ?? { categoryId: "", amount: 0, description: "", date: "", paymentMethodId: "", paidBy: "", evidenceUrls: [] },
  );
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newExpense")}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CategoryPicker kind="expense" gateModule="expenses" value={f.categoryId} onChange={(id) => setF({ ...f, categoryId: id })} label="category" />
        <label className="space-y-1"><span className={lbl}>{t("amount")}</span>
          <input type="number" step="0.01" min="0" value={f.amount || ""}
            onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("date")}</span>
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} /></label>
        <CategoryPicker kind="payment_method" gateModule="expenses" value={f.paymentMethodId} onChange={(id) => setF({ ...f, paymentMethodId: id })} label="paymentMethod" />
        <label className="space-y-1"><span className={lbl}>{t("paidBy")}</span>
          <select value={f.paidBy} onChange={(e) => setF({ ...f, paidBy: e.target.value })} className={field}>
            <option value="">—</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
          </select></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("description")}</span>
          <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={field} /></label>
      </div>
      <EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidenceUrls ?? []}
        onChange={(paths) => setF({ ...f, evidenceUrls: paths })} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
