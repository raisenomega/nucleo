import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { MonthViewDayCell } from "@agenda/presentation/month-view/MonthViewDayCell";
import { monthMatrix } from "@agenda/utils/month-navigation";
import { localDate } from "@agenda/utils/week-navigation";
import type { Appointment } from "@agenda/domain/appointment.types";
import type { BlockedPeriod } from "@agenda/domain/blocked-period.types";

const DOW: TranslationKey[] = ["agendaDowMon", "agendaDowTue", "agendaDowWed", "agendaDowThu", "agendaDowFri", "agendaDowSat", "agendaDowSun"];

export function MonthViewGrid({ month, appts, blocked, onDay }: {
  month: Date; appts: Appointment[]; blocked: BlockedPeriod[]; onDay: (d: Date) => void;
}) {
  const { t } = useI18n();
  const byDay = (d: Date) => appts.filter((a) => localDate(new Date(a.startsAt)) === localDate(d));
  const isBlocked = (d: Date) => { const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); return blocked.some((b) => new Date(b.startsAt).getTime() < s + 86400000 && new Date(b.endsAt).getTime() > s); };
  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">{DOW.map((k) => <div key={k} className="p-1">{t(k)}</div>)}</div>
      {monthMatrix(month).map((week, i) => (
        <div key={i} className="grid grid-cols-7">
          {week.map((d, j) => <MonthViewDayCell key={j} day={d} inMonth={d.getMonth() === month.getMonth()} appts={byDay(d)} blocked={isBlocked(d)} onClick={() => onDay(d)} />)}
        </div>))}
    </div>
  );
}
