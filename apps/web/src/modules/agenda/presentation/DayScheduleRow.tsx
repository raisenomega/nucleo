import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { TimeRangeInput } from "@agenda/presentation/TimeRangeInput";
import type { DayKey, TimeRange } from "@agenda/domain/weekly-schedule.types";

const LABEL: Record<DayKey, TranslationKey> = { mon: "monday", tue: "tuesday", wed: "wednesday", thu: "thursday", fri: "friday", sat: "saturday", sun: "sunday" };
const DEF: TimeRange = { from: "09:00", to: "17:00" };

export function DayScheduleRow({ day, ranges, onChange }: { day: DayKey; ranges: TimeRange[]; onChange: (r: TimeRange[]) => void }) {
  const { t } = useI18n();
  const enabled = ranges.length > 0;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-sm">
      <label className="flex w-28 items-center gap-2 font-medium"><input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked ? [DEF] : [])} />{t(LABEL[day])}</label>
      {ranges.map((r, i) => (
        <TimeRangeInput key={i} range={r} onChange={(v) => onChange(ranges.map((x, j) => (j === i ? v : x)))} onRemove={() => onChange(ranges.filter((_, j) => j !== i))} />
      ))}
      {enabled && <button type="button" onClick={() => onChange([...ranges, DEF])} className="inline-flex items-center gap-1 text-sm text-primary"><Plus className="h-3 w-3" />{t("agendaAddWindow")}</button>}
    </div>
  );
}
