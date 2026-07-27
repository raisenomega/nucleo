import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabaseLeaveRepository } from "@hr/infrastructure/supabase-leave.repository";
import type { CalendarAbsence } from "@hr/domain/leave.types";

// Calendario del equipo: ausencias aprobadas del mes (lista compacta). Navegación mes anterior/siguiente.
export function TeamCalendar() {
  const { t } = useI18n();
  const [ym, setYm] = useState(() => { const d = new Date(); return { m: d.getMonth() + 1, y: d.getFullYear() }; });
  const [abs, setAbs] = useState<CalendarAbsence[]>([]);
  useEffect(() => { void supabaseLeaveRepository.getTeamCalendar(ym.m, ym.y).then(setAbs); }, [ym]);
  const nav = (d: number) => setYm((p) => { let m = p.m + d, y = p.y; if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; } return { m, y }; });
  const monthName = new Date(ym.y, ym.m - 1, 1).toLocaleDateString([], { month: "long", year: "numeric" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => nav(-1)} aria-label={t("prev")} className="rounded-lg bg-secondary p-2"><ChevronLeft className="h-4 w-4" /></button>
        <span className="font-display font-bold capitalize text-foreground">{monthName}</span>
        <button type="button" onClick={() => nav(1)} aria-label={t("next")} className="rounded-lg bg-secondary p-2"><ChevronRight className="h-4 w-4" /></button>
      </div>
      {abs.length === 0 ? <p className="text-sm text-muted-foreground">{t("noAbsences")}</p> : (
        <div className="space-y-1">{abs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: a.color }} />
            <span className="font-semibold text-foreground">{a.employeeName}</span>
            <span className="text-muted-foreground">{a.leaveType}</span>
            <span className="ml-auto text-muted-foreground">{a.startDate.slice(5)} → {a.endDate.slice(5)}</span>
          </div>))}</div>)}
    </div>
  );
}
