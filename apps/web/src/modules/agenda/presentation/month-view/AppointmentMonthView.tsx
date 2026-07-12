import { MonthViewHeader } from "@agenda/presentation/month-view/MonthViewHeader";
import { MonthViewGrid } from "@agenda/presentation/month-view/MonthViewGrid";
import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

export function AppointmentMonthView({ month, appts, blocked, onMonth, onDay }: {
  month: Date; appts: Appointment[]; blocked: BlockedPeriod[]; onMonth: (d: Date) => void; onDay: (d: Date) => void;
}) {
  return (
    <div className="space-y-2">
      <MonthViewHeader month={month} onMonth={onMonth} />
      <MonthViewGrid month={month} appts={appts} blocked={blocked} onDay={onDay} />
    </div>
  );
}
