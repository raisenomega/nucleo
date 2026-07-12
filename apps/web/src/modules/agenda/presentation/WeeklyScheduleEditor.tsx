import { DAY_KEYS } from "@agenda/domain/weekly-schedule.types";
import { DayScheduleRow } from "@agenda/presentation/DayScheduleRow";
import type { WeeklySchedule, TimeRange } from "@agenda/domain/weekly-schedule.types";

export function WeeklyScheduleEditor({ value, onChange }: { value: WeeklySchedule; onChange: (v: WeeklySchedule) => void }) {
  return (
    <div className="rounded-lg border border-border p-3">
      {DAY_KEYS.map((d) => (
        <DayScheduleRow key={d} day={d} ranges={value[d] ?? []} onChange={(r: TimeRange[]) => onChange({ ...value, [d]: r })} />
      ))}
    </div>
  );
}
