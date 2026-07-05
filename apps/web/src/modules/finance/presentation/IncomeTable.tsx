import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { Income } from "@finance/domain/income.types";

export function IncomeTable({ rows, onEdit, onDelete }: {
  rows: readonly Income[]; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-body font-bold">{t("incomeList")} ({rows.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("category")}</th>
            <th className={th}>{t("description")}</th><th className={`${th} text-right`}>{t("amount")}</th>
            <th className={th}>{t("paymentMethod")}</th><th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.date}</td>
                <td className="px-3 py-2">{i.categoryLabel}</td>
                <td className="px-3 py-2">{i.description}</td>
                <td className="px-3 py-2 text-right font-semibold">{i.amount}</td>
                <td className="px-3 py-2">{i.paymentMethodLabel}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onDelete(i.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
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
