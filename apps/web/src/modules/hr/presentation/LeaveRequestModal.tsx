import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { businessDays } from "@hr/presentation/leave-ui";
import type { LeaveType, LeaveBalance, LeaveRequestData } from "@hr/domain/leave.types";
import type { AttResult } from "@hr/domain/attendance.types";

export function LeaveRequestModal({ types, balances, onSubmit, onClose }: {
  types: readonly LeaveType[]; balances: readonly LeaveBalance[];
  onSubmit: (d: LeaveRequestData) => Promise<AttResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [half, setHalf] = useState(false);
  const [period, setPeriod] = useState("morning");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const days = half ? 0.5 : businessDays(start, end || start);
  const bal = balances.find((b) => b.leaveTypeId === typeId);
  const insufficient = bal != null && days > bal.available;
  async function save() {
    if (!typeId || !start) { setErr(t("requiredFields")); return; }
    const r = await onSubmit({ leaveTypeId: typeId, startDate: start, endDate: half ? start : (end || start), reason, isHalfDay: half, halfDayPeriod: half ? period : null });
    if (r.ok) onClose(); else setErr(r.error);
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("requestLeave")}</h2>
        <label className="block space-y-1"><span className={lbl}>{t("leaveType")}</span>
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={fld}>{types.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={half} onChange={(e) => setHalf(e.target.checked)} /> {t("halfDay")}</label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className={lbl}>{t("from")}</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fld} /></label>
          {half ? <label className="space-y-1"><span className={lbl}>{t("halfDay")}</span><select value={period} onChange={(e) => setPeriod(e.target.value)} className={fld}><option value="morning">{t("morning")}</option><option value="afternoon">{t("afternoon")}</option></select></label>
            : <label className="space-y-1"><span className={lbl}>{t("to")}</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={fld} /></label>}
        </div>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reason")} rows={2} className={fld} />
        {start && <div className="rounded-lg bg-secondary p-2 text-sm">
          <p>{days} {t("daysRequested")}{bal && ` · ${t("available")}: ${bal.available} → ${(bal.available - days).toFixed(1)}`}</p>
          {insufficient && <p className="font-bold text-destructive">{t("insufficientBalance")}</p>}</div>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" disabled={insufficient} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("sendRequest")}</button></div>
      </div>
    </ScreenModal>
  );
}
