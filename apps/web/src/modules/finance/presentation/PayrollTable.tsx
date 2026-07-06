import { Eye, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import type { Payroll } from "@finance/domain/payroll.types";

const grossOf = (i: Payroll) => i.grossSalary || i.amount;
const netOf = (i: Payroll) => i.netSalary || i.amount;
const costOf = (i: Payroll) => i.totalEmployerCost || i.amount;

export function PayrollTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly Payroll[];
  onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const money = can("payroll", "salary"); // salario/deducciones/patronal gateado por payroll.salary
  const total = rows.reduce((s, i) => s + costOf(i), 0);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("payrollList")} ({rows.length})</h2>
        {money && <span className="font-body font-bold text-primary">{t("totalEmployerCost")}: {formatCurrency(total)}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("date")}</th><th className={th}>{t("employee")}</th>
            {money && <><th className={`${th} text-right`}>{t("grossSalary")}</th><th className={`${th} text-right`}>{t("withheld")}</th>
            <th className={`${th} text-right`}>{t("netSalary")}</th><th className={`${th} text-right`}>{t("employerCost")}</th></>}
            <th className={`${th} text-right`}>{t("actions")}</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={money ? 7 : 3} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.date}</td>
                <td className="px-3 py-2">{i.employeeName}</td>
                {money && <><td className="px-3 py-2 text-right font-semibold">{formatCurrency(grossOf(i))}</td>
                <td className="px-3 py-2 text-right text-destructive">{formatCurrency(grossOf(i) - netOf(i))}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(netOf(i))}</td>
                <td className="px-3 py-2 text-right font-semibold text-primary">{formatCurrency(costOf(i))}</td></>}
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onView(i.id)} aria-label={t("viewDetail")} className="text-foreground"><Eye className="h-4 w-4" /></button>
                    {onEdit && <button type="button" onClick={() => onEdit(i.id)} aria-label={t("edit")} className="text-primary"><Pencil className="h-4 w-4" /></button>}
                    {onDelete && <button type="button" onClick={() => onDelete(i.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
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
