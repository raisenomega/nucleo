import { useState } from "react";
import { Calculator } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

// Calcula el gross desde la asistencia real del mes de la fecha de pago (horas × tasa + overtime).
export function AttendanceGrossButton({ employeeId, date, onFill }: {
  employeeId: string; date: string; onFill: (gross: number, regular: number, overtime: number) => void;
}) {
  const { t } = useI18n();
  const [p, setP] = useState<{ reg: number; ot: number; gross: number; rate: number; mult: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function calc() {
    setBusy(true);
    const ref = date ? new Date(date) : new Date();
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString().slice(0, 10);
    const { data, error } = await supabase.rpc("calculate_gross_from_attendance", { p_employee_id: employeeId, p_from: from, p_to: ref.toISOString().slice(0, 10) });
    setBusy(false);
    // Antes: `if (!data) return;` — el botón no hacía nada y el usuario no sabía por qué (auditoría E2E §13).
    if (error || !data) { setErr(error?.message ?? "Sin datos de asistencia"); return; }
    setErr("");
    const d = data as Record<string, number>;
    setP({ reg: Number(d.regular_hours), ot: Number(d.overtime_hours), gross: Number(d.gross_total), rate: Number(d.hourly_rate), mult: Number(d.overtime_multiplier) });
  }
  return (
    <div className="space-y-1">
      <button type="button" onClick={() => void calc()} className="flex items-center gap-1 text-xs font-bold text-primary"><Calculator className="h-3 w-3" /> {busy ? "…" : t("calcFromAttendance")}</button>
      {err && <p className="text-xs text-destructive">{err}</p>}
      {p && (
        <div className="rounded-lg bg-secondary p-2 text-xs">
          <p>{t("regularHours")}: {p.reg}h × ${p.rate} + {t("overtimeHours")}: {p.ot}h × ${(p.rate * p.mult).toFixed(1)} = <span className="font-bold text-foreground">${p.gross}</span></p>
          <button type="button" onClick={() => { onFill(p.gross, p.reg, p.ot); setP(null); }} className="mt-1 rounded bg-primary px-2 py-0.5 font-bold text-primary-foreground">{t("applyGross")}</button>
        </div>)}
    </div>
  );
}
