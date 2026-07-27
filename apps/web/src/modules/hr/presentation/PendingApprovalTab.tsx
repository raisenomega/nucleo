import { Check, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { LeaveRequest } from "@hr/domain/leave.types";

// Solicitudes pendientes de todo el equipo (staff): aprobar / rechazar.
export function PendingApprovalTab({ rows, onApprove, onReject }: {
  rows: readonly LeaveRequest[]; onApprove: (id: string) => void; onReject: (id: string) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
        <th className="p-2">{t("employee")}</th><th className="p-2">{t("leaveType")}</th><th className="p-2">{t("from")}</th><th className="p-2">{t("to")}</th>
        <th className="p-2">{t("daysRequested")}</th><th className="p-2">{t("reason")}</th><th className="p-2"></th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id} className="border-b border-border align-top">
          <td className="p-2 font-semibold">{r.employeeName}</td>
          <td className="p-2"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: r.leaveTypeColor }} />{r.leaveTypeName}</span></td>
          <td className="p-2">{r.startDate.slice(5)}</td><td className="p-2">{r.endDate.slice(5)}</td><td className="p-2">{r.daysRequested}</td>
          <td className="max-w-xs p-2 text-muted-foreground">{r.reason ?? "—"}</td>
          <td className="p-2"><div className="flex justify-end gap-2">
            <button type="button" onClick={() => onApprove(r.id)} aria-label={t("approve")} className="text-green-600"><Check className="h-5 w-5" /></button>
            <button type="button" onClick={() => onReject(r.id)} aria-label={t("reject")} className="text-destructive"><X className="h-5 w-5" /></button></div></td></tr>))}</tbody>
    </table></div>
  );
}
