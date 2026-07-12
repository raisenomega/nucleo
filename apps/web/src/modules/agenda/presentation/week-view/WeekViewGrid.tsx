import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { WeekViewHourColumn } from "@agenda/presentation/week-view/WeekViewHourColumn";
import { WeekDayColumn } from "@agenda/presentation/week-view/WeekDayColumn";
import { weekDays } from "@agenda/utils/week-navigation";
import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

export function WeekViewGrid({ monday, hourRange, appts, blocked, onCreate, onEdit, onReschedule }: {
  monday: Date; hourRange: [number, number]; appts: Appointment[]; blocked: BlockedPeriod[];
  onCreate: (day: Date, mm: number) => void; onEdit: (a: Appointment) => void; onReschedule: (id: string, startMs: number) => void;
}) {
  const [sh, eh] = hourRange;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  function onDragEnd(e: DragEndEvent) {
    const over = e.over?.id; if (typeof over !== "string") return;
    const [dayStr, mm] = over.split("|"); if (!dayStr || mm === undefined) return;
    const [y, mo, d] = dayStr.split("-");
    const start = new Date(Number(y), Number(mo) - 1, Number(d)); start.setMinutes(Number(mm));
    onReschedule(String(e.active.id), start.getTime());
  }
  return (
    <DndContext sensors={sensors} modifiers={[restrictToParentElement]} onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto">
        <WeekViewHourColumn startHour={sh} endHour={eh} />
        {weekDays(monday).map((day, i) => (
          <WeekDayColumn key={i} day={day} startHour={sh} endHour={eh} appts={appts} blocked={blocked} onCreate={(mm) => onCreate(day, mm)} onEdit={onEdit} />
        ))}
      </div>
    </DndContext>
  );
}
