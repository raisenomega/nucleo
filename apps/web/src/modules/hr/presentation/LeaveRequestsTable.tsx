import { useI18n } from "@shared/i18n";
import { LS_KEY, LS_COLOR } from "@hr/presentation/leave-ui";
import type { LeaveRequest } from "@hr/domain/leave.types";

// Lista de solicitudes. onCancel presente = pestaña "mis solicitudes" (cancelar las pendientes).
export function LeaveRequestsTable({ rows, onCancel }: { rows: readonly LeaveRequest[]; onCancel?: (id: string) => void }) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
        <th className="p-2">{t("leaveType")}</th><th className="p-2">{t("from")}</th><th className="p-2">{t("to")}</th>
        <th className="p-2">{t("daysRequested")}</th><th className="p-2">{t("status")}</th><th className="p-2"></th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id} className="border-b border-border">
          <td className="p-2"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: r.leaveTypeColor }} />{r.leaveTypeName}</span></td>
          <td className="p-2">{r.startDate.slice(5)}</td><td className="p-2">{r.endDate.slice(5)}</td><td className="p-2">{r.daysRequested}{r.isHalfDay ? " ½" : ""}</td>
          <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${LS_COLOR[r.status]}`}>{t(LS_KEY[r.status])}</span></td>
          <td className="p-2 text-right">{onCancel && r.status === "pending" && <button type="button" onClick={() => onCancel(r.id)} className="text-xs font-bold text-destructive">{t("cancel")}</button>}</td></tr>))}</tbody>
    </table></div>
  );
}
