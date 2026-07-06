import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { RecurringExpense } from "@finance/domain/recurring-expense.types";

export function RecurringExpenseTable({ items, paid, onPay, onEdit, onDelete }: {
  items: readonly RecurringExpense[]; paid: Record<string, number>;
  onPay: (categoryId: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const paidOf = (i: RecurringExpense) => paid[i.categoryId] ?? 0;
  const covered = items.filter((i) => paidOf(i) > 0).length;
  const pct = items.length ? Math.round((covered / items.length) * 100) : 0;
  const totalBudget = items.reduce((s, i) => s + i.budgetedAmount, 0);
  const totalPaid = items.reduce((s, i) => s + paidOf(i), 0);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground">{t("coveredPercent").replace("{done}", String(covered)).replace("{total}", String(items.length)).replace("{pct}", String(pct))}</div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
      <div className="flex flex-wrap gap-4 text-sm">
        <span>{t("budgeted")}: <b>{formatCurrency(totalBudget)}</b></span>
        <span>{t("paid")}: <b className="text-green-600">{formatCurrency(totalPaid)}</b></span>
        <span>{t("pending")}: <b className="text-yellow-700">{formatCurrency(Math.max(0, totalBudget - totalPaid))}</b></span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("category")}</th><th className={th}>{t("description")}</th>
            <th className={`${th} text-right`}>{t("budgeted")}</th><th className={`${th} text-right`}>{t("paid")}</th>
            <th className={`${th} text-right`}>{t("status")}</th>
          </tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">{t("noRecords")}</td></tr>}
            {items.map((i) => {
              const p = paidOf(i);
              return (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-3 py-2">{i.categoryLabel}</td>
                  <td className="px-3 py-2">{i.label}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(i.budgetedAmount)}</td>
                  <td className="px-3 py-2 text-right">{p > 0 ? <span className="text-green-600">{formatCurrency(p)} ✅</span> : <span className="text-muted-foreground">⏳</span>}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      {p === 0 && <button type="button" onClick={() => onPay(i.categoryId)} className="rounded bg-primary text-primary-foreground px-2 py-1 text-xs font-bold">{t("registerPayment")}</button>}
                      <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => onDelete(i.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
