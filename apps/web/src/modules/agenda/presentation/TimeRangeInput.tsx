import type { TimeRange } from "@agenda/domain/weekly-schedule.types";

export function TimeRangeInput({ range, onChange, onRemove }: { range: TimeRange; onChange: (r: TimeRange) => void; onRemove: () => void }) {
  const inp = "rounded border border-border bg-background p-1 text-sm";
  return (
    <div className="flex items-center gap-1">
      <input type="time" step={900} value={range.from} onChange={(e) => onChange({ ...range, from: e.target.value })} className={inp} />
      <span aria-hidden>–</span>
      <input type="time" step={900} value={range.to} onChange={(e) => onChange({ ...range, to: e.target.value })} className={inp} />
      <button type="button" onClick={onRemove} aria-label="×" className="px-1 text-destructive">×</button>
    </div>
  );
}
