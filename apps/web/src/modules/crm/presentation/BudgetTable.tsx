import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { Budget } from "@crm/domain/marketing.types";

export function BudgetTable({ rows, onSelect, onEdit, onDelete }: {
  rows: readonly Budget[]; onSelect: (b: Budget) => void; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const total = rows.reduce((s, b) => s + b.budgetedAmount, 0);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("budgetList")} ({rows.length})</h2>
        <span className="font-body font-bold text-primary">{t("total")}: {formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("channel")}</th><th className={`${th} text-right`}>{t("budgetedAmount")}</th>
            <th className={th}>{t("notes")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (<tr><td colSpan={4} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>)}
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-3 py-2"><button type="button" onClick={() => onSelect(b)} className="font-medium text-primary hover:underline">{b.channel}</button></td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(b.budgetedAmount)}</td>
                <td className="px-3 py-2">{b.notes}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onEdit(b.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onDelete(b.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
