import { AppointmentListView } from "@agenda/presentation/AppointmentListView";
import { AppointmentWeekView } from "@agenda/presentation/week-view/AppointmentWeekView";
import { AppointmentMonthView } from "@agenda/presentation/month-view/AppointmentMonthView";
import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

export function AgendaViews(p: {
  view: string; monday: Date; month: Date; hourRange: [number, number]; appts: Appointment[]; blocked: BlockedPeriod[];
  onEdit: (a: Appointment) => void; onDelete: (id: string) => void; onCreate: (day: Date, mm: number) => void;
  onReschedule: (id: string, startMs: number) => void; onWeek: (d: Date) => void; onMonth: (d: Date) => void; onDay: (d: Date) => void;
}) {
  if (p.view === "week") return <AppointmentWeekView monday={p.monday} hourRange={p.hourRange} appts={p.appts} blocked={p.blocked} onWeek={p.onWeek} onCreate={p.onCreate} onEdit={p.onEdit} onReschedule={p.onReschedule} />;
  if (p.view === "month") return <AppointmentMonthView month={p.month} appts={p.appts} blocked={p.blocked} onMonth={p.onMonth} onDay={p.onDay} />;
  return <AppointmentListView list={p.appts} onEdit={p.onEdit} onDelete={p.onDelete} />;
}
