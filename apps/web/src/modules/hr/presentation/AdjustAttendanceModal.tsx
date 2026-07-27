import { useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseAttendanceRepository } from "@hr/infrastructure/supabase-attendance.repository";
import { toLocalInput } from "@hr/presentation/att-ui";
import type { AttendanceRecord } from "@hr/domain/attendance.types";

export function AdjustAttendanceModal({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const { t } = useI18n();
  const [ci, setCi] = useState(toLocalInput(record.clockIn));
  const [co, setCo] = useState(toLocalInput(record.clockOut));
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const worked = useMemo(() => (ci && co ? Math.round(((new Date(co).getTime() - new Date(ci).getTime()) / 3600000) * 100) / 100 : null), [ci, co]);
  async function save() {
    if (!reason.trim()) { setErr(t("requiredFields")); return; }
    const r = await supabaseAttendanceRepository.adjust(record.id, ci ? new Date(ci).toISOString() : null, co ? new Date(co).toISOString() : null, reason);
    if (r.ok) onClose(); else setErr(r.error);
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("adjustAttendance")} · {record.employeeName}</h2>
        <label className="block space-y-1"><span className={lbl}>{t("clockIn")}</span><input type="datetime-local" value={ci} onChange={(e) => setCi(e.target.value)} className={fld} /></label>
        <label className="block space-y-1"><span className={lbl}>{t("clockOut")}</span><input type="datetime-local" value={co} onChange={(e) => setCo(e.target.value)} className={fld} /></label>
        {worked != null && <p className="text-sm text-muted-foreground">{t("hoursWorked")}: <span className="font-bold text-foreground">{worked}h</span></p>}
        <label className="block space-y-1"><span className={lbl}>{t("adjustmentReason")}</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={fld} /></label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
