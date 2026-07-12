import { WeekViewSlot } from "@agenda/presentation/week-view/WeekViewSlot";
import { DraggableAppointmentBlock } from "@agenda/presentation/week-view/DraggableAppointmentBlock";
import { BlockedPeriodBand } from "@agenda/presentation/week-view/BlockedPeriodBand";
import { SLOT_MIN, SLOT_PX, durationPx } from "@agenda/presentation/week-view/grid-consts";
import { localDate } from "@agenda/utils/week-navigation";
import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

export function WeekDayColumn({ day, startHour, endHour, appts, blocked, onCreate, onEdit }: {
  day: Date; startHour: number; endHour: number; appts: Appointment[]; blocked: BlockedPeriod[]; onCreate: (mm: number) => void; onEdit: (a: Appointment) => void;
}) {
  const dayStr = localDate(day);
  const base = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour).getTime();
  const dayEnd = base + (endHour - startHour) * 3600000;
  const maxPx = (endHour - startHour) * (60 / SLOT_MIN) * SLOT_PX;
  const px = (iso: string) => Math.max(0, Math.min(maxPx, (new Date(iso).getTime() - base) / 60000 / SLOT_MIN * SLOT_PX));
  const slots = []; for (let mm = startHour * 60; mm < endHour * 60; mm += SLOT_MIN) slots.push(mm);
  return (
    <div className="relative flex-1 border-l border-border">
      {slots.map((mm) => <WeekViewSlot key={mm} id={`${dayStr}|${mm}`} onClick={() => onCreate(mm)} />)}
      {blocked.filter((b) => new Date(b.startsAt).getTime() < dayEnd && new Date(b.endsAt).getTime() > base)
        .map((b) => <BlockedPeriodBand key={b.id} top={px(b.startsAt)} height={px(b.endsAt) - px(b.startsAt)} label={b.reason} />)}
      {appts.filter((a) => localDate(new Date(a.startsAt)) === dayStr)
        .map((a) => <DraggableAppointmentBlock key={a.id} apt={a} top={px(a.startsAt)} height={durationPx(a.startsAt, a.endsAt)} onEdit={() => onEdit(a)} />)}
    </div>
  );
}
