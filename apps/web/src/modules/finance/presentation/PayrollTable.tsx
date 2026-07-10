import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { Pagination } from "@shared/components/Pagination";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useSession } from "@shared/providers/SessionProvider";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import type { Payroll } from "@finance/domain/payroll.types";

const grossOf = (i: Payroll) => i.grossSalary || i.amount, netOf = (i: Payroll) => i.netSalary || i.amount, costOf = (i: Payroll) => i.totalEmployerCost || i.amount;

export function PayrollTable({ rows, onView, onEdit, onDelete }: {
  rows: readonly Payroll[];
  onView: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess(); const { canEdit } = useRoleGate(); const { session } = useSession();
  const money = can("payroll", "salary"); // salario/deducciones/patronal gateado por payroll.salary
  // coo+ ven todo; roles menores solo lo que crearon (espejo de la RLS 00068).
  const visible = canEdit("coo") ? rows : rows.filter((r) => r.createdBy === session?.userId);
  const total = visible.reduce((s, i) => s + costOf(i), 0);
  const [page, setPage] = useState(1);
  const paged = visible.slice((page - 1) * 12, page * 12);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <>
    <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("payrollList")} ({visible.length})</h2>
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
            {visible.length === 0 && (
              <tr><td colSpan={money ? 7 : 3} className="py-8 text-center text-muted-foreground">{t("noRecords")}</td></tr>
            )}
            {paged.map((i) => (
              <tr key={i.id} onClick={() => onView(i.id)} className="cursor-pointer border-t border-border transition-colors hover:bg-secondary">
                <td className="px-3 py-2">{i.date}</td>
                <td className="px-3 py-2">{i.employeeName}</td>
                {money && <><td className="px-3 py-2 text-right font-semibold">{formatCurrency(grossOf(i))}</td>
                <td className="px-3 py-2 text-right text-destructive">{formatCurrency(grossOf(i) - netOf(i))}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(netOf(i))}</td>
                <td className="px-3 py-2 text-right font-semibold text-primary">{formatCurrency(costOf(i))}</td></>}
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
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
    <div className="space-y-2 md:hidden">
      {paged.map((i) => <MobileCard key={i.id} title={i.employeeName} amount={money ? formatCurrency(costOf(i)) : undefined}
        lines={[i.period, money ? `${t("grossSalary")} ${formatCurrency(grossOf(i))} · ${t("netSalary")} ${formatCurrency(netOf(i))}` : ""]}
        onView={() => onView(i.id)} onEdit={onEdit ? () => onEdit(i.id) : undefined} onDelete={onDelete ? () => onDelete(i.id) : undefined} />)}
    </div>
    <Pagination total={visible.length} page={page} onPageChange={setPage} />
    </>
  );
}
