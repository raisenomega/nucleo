import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import { supabaseAttendanceRepository } from "@hr/infrastructure/supabase-attendance.repository";
import { AdjustAttendanceModal } from "@hr/presentation/AdjustAttendanceModal";
import { clockHHMM, hoursLabel } from "@hr/presentation/att-ui";
import type { AttendanceRecord } from "@hr/domain/attendance.types";

const fromDate = (r: "week" | "month") => { const d = new Date(); d.setDate(d.getDate() - (r === "week" ? 7 : 30)); return d.toISOString().slice(0, 10); };

export function AttendanceHistory({ userId, isStaff }: { userId: string; isStaff: boolean }) {
  const { t } = useI18n();
  const [range, setRange] = useState<"week" | "month">("month");
  const [emp, setEmp] = useState(isStaff ? "" : userId);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [emps, setEmps] = useState<{ id: string; full_name: string }[]>([]);
  const [adj, setAdj] = useState<AttendanceRecord | null>(null);
  const [nonce, setNonce] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => { void supabaseAttendanceRepository.list(emp || (isStaff ? null : userId), fromDate(range), today).then(setRows); }, [range, emp, isStaff, userId, nonce, today]);
  useEffect(() => { if (isStaff) void supabase.from("profiles").select("id,full_name").then(({ data }) => setEmps((data as { id: string; full_name: string }[]) ?? [])); }, [isStaff]);
  const s = useMemo(() => rows.reduce((a, r) => { a.th += r.hoursWorked ?? 0; a.rh += r.hoursRegular ?? 0; a.oh += r.hoursOvertime ?? 0; a.late += r.isLate ? 1 : 0; a.days.add(r.workDate); return a; }, { th: 0, rh: 0, oh: 0, late: 0, days: new Set<string>() }), [rows]);
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const kpi = (label: string, v: string) => <div className="rounded-lg border border-border bg-card p-2 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold text-foreground">{v}</p></div>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select value={range} onChange={(e) => setRange(e.target.value as "week" | "month")} className={fld}><option value="week">{t("thisWeek")}</option><option value="month">{t("thisMonth")}</option></select>
        {isStaff && <select value={emp} onChange={(e) => setEmp(e.target.value)} className={fld}><option value="">{t("allEmployees")}</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {kpi(t("totalHours"), `${s.th.toFixed(1)}h`)}{kpi(t("regularHours"), `${s.rh.toFixed(1)}h`)}{kpi(t("overtimeHours"), `${s.oh.toFixed(1)}h`)}
        {kpi(t("daysWorked"), `${s.days.size}`)}{kpi(t("lateArrival"), `${s.late}`)}
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("date")}</th><th className="p-2">{t("employee")}</th><th className="p-2">{t("clockIn")}</th><th className="p-2">{t("clockOut")}</th>
            <th className="p-2">{t("regularHours")}</th><th className="p-2">{t("overtimeHours")}</th>{isStaff && <th className="p-2"></th>}</tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="p-2">{r.workDate.slice(5)}</td><td className="p-2 font-semibold">{r.employeeName}</td>
              <td className="p-2">{clockHHMM(r.clockIn)}{r.isLate && <span className="ml-1 text-red-600">⏰</span>}</td><td className="p-2">{clockHHMM(r.clockOut)}</td>
              <td className="p-2">{hoursLabel(r.hoursRegular)}</td><td className="p-2">{hoursLabel(r.hoursOvertime)}</td>
              {isStaff && <td className="p-2 text-right"><button type="button" onClick={() => setAdj(r)} className="text-xs font-bold text-primary">{t("adjust")}</button></td>}</tr>))}</tbody>
        </table></div>)}
      {adj && <AdjustAttendanceModal record={adj} onClose={() => { setAdj(null); setNonce((n) => n + 1); }} />}
    </div>
  );
}
