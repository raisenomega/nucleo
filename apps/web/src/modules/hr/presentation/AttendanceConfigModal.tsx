import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseAttendanceRepository } from "@hr/infrastructure/supabase-attendance.repository";
import type { AttendanceConfig } from "@hr/domain/attendance.types";

const DEF: AttendanceConfig = { workStartTime: "08:00", workEndTime: "17:00", dailyHoursLimit: 8, weeklyHoursLimit: 40,
  overtimeMultiplier: 1.5, graceMinutes: 15, autoCheckoutEnabled: true, autoCheckoutAfterHours: 12, requireGps: false };

export function AttendanceConfigModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [c, setC] = useState<AttendanceConfig>(DEF);
  const [err, setErr] = useState("");
  useEffect(() => { void supabaseAttendanceRepository.getConfig().then((cfg) => { if (cfg) setC(cfg); }); }, []);
  const set = <K extends keyof AttendanceConfig>(k: K, v: AttendanceConfig[K]) => setC((p) => ({ ...p, [k]: v }));
  async function save() { const r = await supabaseAttendanceRepository.updateConfig(c, tenantId); if (r.ok) onClose(); else setErr(r.error); }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const chk = "flex items-center gap-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("attendanceConfig")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className={lbl}>{t("workStart")}</span><input type="time" value={c.workStartTime} onChange={(e) => set("workStartTime", e.target.value)} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("workEnd")}</span><input type="time" value={c.workEndTime} onChange={(e) => set("workEndTime", e.target.value)} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("dailyLimit")}</span><input type="number" value={c.dailyHoursLimit} onChange={(e) => set("dailyHoursLimit", Number(e.target.value))} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("weeklyLimit")}</span><input type="number" value={c.weeklyHoursLimit} onChange={(e) => set("weeklyHoursLimit", Number(e.target.value))} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("overtimeMultiplier")}</span><input type="number" step="0.1" value={c.overtimeMultiplier} onChange={(e) => set("overtimeMultiplier", Number(e.target.value))} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("graceMinutes")}</span><input type="number" value={c.graceMinutes} onChange={(e) => set("graceMinutes", Number(e.target.value))} className={fld} /></label>
          <label className="space-y-1"><span className={lbl}>{t("autoCheckout")} (h)</span><input type="number" value={c.autoCheckoutAfterHours} onChange={(e) => set("autoCheckoutAfterHours", Number(e.target.value))} className={fld} /></label>
        </div>
        <label className={chk}><input type="checkbox" checked={c.autoCheckoutEnabled} onChange={(e) => set("autoCheckoutEnabled", e.target.checked)} /> {t("autoCheckout")}</label>
        <label className={chk}><input type="checkbox" checked={c.requireGps} onChange={(e) => set("requireGps", e.target.checked)} /> {t("requireGps")}</label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
