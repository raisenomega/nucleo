import { SLOT_PX } from "@agenda/presentation/week-view/grid-consts";
import { pad } from "@agenda/utils/week-navigation";

export function WeekViewHourColumn({ startHour, endHour }: { startHour: number; endHour: number }) {
  const hours = []; for (let h = startHour; h < endHour; h++) hours.push(h);
  return (
    <div className="w-12 shrink-0">
      {hours.map((h) => <div key={h} style={{ height: SLOT_PX * 2 }} className="border-t border-border pr-1 text-right text-[10px] text-muted-foreground">{pad(h)}:00</div>)}
    </div>
  );
}
