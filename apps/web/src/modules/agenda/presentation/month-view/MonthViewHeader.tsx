import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { addMonths } from "@agenda/utils/month-navigation";

export function MonthViewHeader({ month, onMonth }: { month: Date; onMonth: (d: Date) => void }) {
  const { t, locale } = useI18n();
  const label = month.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { month: "long", year: "numeric" });
  const btn = "rounded-lg border border-border p-2";
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onMonth(addMonths(month, -1))} aria-label={t("agendaPrevMonth")} className={btn}><ChevronLeft className="h-4 w-4" /></button>
      <button type="button" onClick={() => onMonth(new Date())} className="rounded-lg border border-border px-3 py-2 text-sm">{t("agendaToday")}</button>
      <button type="button" onClick={() => onMonth(addMonths(month, 1))} aria-label={t("agendaNextMonth")} className={btn}><ChevronRight className="h-4 w-4" /></button>
      <span className="text-sm font-medium capitalize text-foreground">{label}</span>
    </div>
  );
}
