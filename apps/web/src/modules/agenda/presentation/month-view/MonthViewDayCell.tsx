import { sameDay } from "@agenda/utils/week-navigation";
import type { Appointment } from "@agenda/domain/appointment.types";

const badgeColor = (a: Appointment[]) =>
  a.some((x) => x.status === "no-show") ? "bg-orange-500" : a.some((x) => x.status === "cancelada") ? "bg-red-500/70"
    : a.length > 0 && a.every((x) => x.status === "completada") ? "bg-green-500" : "bg-primary";

export function MonthViewDayCell({ day, inMonth, appts, blocked, onClick }: {
  day: Date; inMonth: boolean; appts: Appointment[]; blocked: boolean; onClick: () => void;
}) {
  const today = new Date();
  return (
    <button type="button" onClick={onClick}
      className={`flex min-h-[64px] flex-col items-start gap-1 border border-border p-1 text-left text-xs ${inMonth ? "" : "opacity-40"} ${blocked ? "bg-muted/30" : ""}`}>
      <span className={sameDay(day, today) ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" : "text-foreground"}>{day.getDate()}</span>
      {appts.length > 0 && <span className={`mt-auto rounded-full px-1.5 text-[10px] font-bold text-white ${badgeColor(appts)}`}>{appts.length}</span>}
    </button>
  );
}
