import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabaseAttendanceRepository } from "@hr/infrastructure/supabase-attendance.repository";
import { clockHHMM, hoursLabel } from "@hr/presentation/att-ui";
import type { AttendanceRecord } from "@hr/domain/attendance.types";

// Estado del equipo hoy (staff). Muestra quién marcó entrada/salida.
export function TeamTodayTable() {
  const { t } = useI18n();
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    void supabaseAttendanceRepository.list(null, today, today).then(setRows);
  }, []);
  const active = rows.filter((r) => r.status === "active").length;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-foreground">{t("team")}</span>
        <span className="text-muted-foreground">{active} {t("working")} · {rows.length} {t("records")}</span>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("employee")}</th><th className="p-2">{t("clockIn")}</th><th className="p-2">{t("clockOut")}</th>
            <th className="p-2">{t("hoursWorked")}</th><th className="p-2">{t("status")}</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="p-2 font-semibold">{r.employeeName}</td>
              <td className="p-2">{clockHHMM(r.clockIn)}{r.isLate && <span className="ml-1 text-red-600" title={t("lateArrival")}>⏰</span>}</td>
              <td className="p-2">{clockHHMM(r.clockOut)}</td><td className="p-2">{hoursLabel(r.hoursWorked)}</td>
              <td className="p-2">{r.status === "active" ? <span className="font-bold text-green-600">{t("working")}</span> : t("completed")}</td></tr>))}</tbody>
        </table></div>)}
    </div>
  );
}
