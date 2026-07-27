import { useI18n } from "@shared/i18n";
import { balanceTone } from "@hr/presentation/leave-ui";
import type { LeaveBalance } from "@hr/domain/leave.types";

export function LeaveBalancesTable({ rows, showEmployee }: { rows: readonly LeaveBalance[]; showEmployee: boolean }) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
        {showEmployee && <th className="p-2">{t("employee")}</th>}<th className="p-2">{t("leaveType")}</th>
        <th className="p-2">{t("accrued")}</th><th className="p-2">{t("used")}</th><th className="p-2">{t("pending")}</th><th className="p-2">{t("available")}</th></tr></thead>
      <tbody>{rows.map((b) => (
        <tr key={b.id} className="border-b border-border">
          {showEmployee && <td className="p-2 font-semibold">{b.employeeName}</td>}
          <td className="p-2"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: b.leaveTypeColor }} />{b.leaveTypeName}</span></td>
          <td className="p-2">{b.accrued}</td><td className="p-2">{b.used}</td><td className="p-2">{b.pending}</td>
          <td className={`p-2 font-bold ${balanceTone(b.available, b.accrued)}`}>{b.available}</td></tr>))}</tbody>
    </table></div>
  );
}
