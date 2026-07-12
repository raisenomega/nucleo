import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { sameDay } from "@agenda/utils/week-navigation";

const DOW: TranslationKey[] = ["agendaDowMon", "agendaDowTue", "agendaDowWed", "agendaDowThu", "agendaDowFri", "agendaDowSat", "agendaDowSun"];

export function WeekViewHeader({ days }: { days: Date[] }) {
  const { t } = useI18n();
  const today = new Date();
  return (
    <div className="flex border-b border-border">
      <div className="w-12 shrink-0" />
      {days.map((d, i) => (
        <div key={i} className={`flex-1 border-l border-border p-1 text-center text-xs ${sameDay(d, today) ? "font-bold text-foreground" : "text-muted-foreground"}`}>
          {t(DOW[i]!)} {d.getDate()}
        </div>))}
    </div>
  );
}
