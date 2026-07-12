import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { WeekViewHeader } from "@agenda/presentation/week-view/WeekViewHeader";
import { WeekViewGrid } from "@agenda/presentation/week-view/WeekViewGrid";
import { weekDays, addDays } from "@agenda/utils/week-navigation";
import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

export function AppointmentWeekView({ monday, hourRange, appts, blocked, onWeek, onCreate, onEdit, onReschedule }: {
  monday: Date; hourRange: [number, number]; appts: Appointment[]; blocked: BlockedPeriod[];
  onWeek: (d: Date) => void; onCreate: (day: Date, mm: number) => void; onEdit: (a: Appointment) => void; onReschedule: (id: string, startMs: number) => void;
}) {
  const { t } = useI18n();
  const days = weekDays(monday);
  const a = days[0]!, b = days[6]!;
  const label = `${a.getDate()}/${a.getMonth() + 1} – ${b.getDate()}/${b.getMonth() + 1}`;
  const btn = "rounded-lg border border-border p-2";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onWeek(addDays(monday, -7))} aria-label={t("agendaPrevWeek")} className={btn}><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => onWeek(new Date())} className="rounded-lg border border-border px-3 py-2 text-sm">{t("agendaToday")}</button>
        <button type="button" onClick={() => onWeek(addDays(monday, 7))} aria-label={t("agendaNextWeek")} className={btn}><ChevronRight className="h-4 w-4" /></button>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="rounded-lg border border-border">
        <WeekViewHeader days={days} />
        <WeekViewGrid monday={monday} hourRange={hourRange} appts={appts} blocked={blocked} onCreate={onCreate} onEdit={onEdit} onReschedule={onReschedule} />
      </div>
    </div>
  );
}
