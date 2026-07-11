import { useI18n } from "@shared/i18n";
import type { BusinessHours } from "@landing/domain/landing.types";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

// Editor de horario: 7 filas con toggle abierto + open/close. Devuelve jsonb {monday:{open,close}|null,...}.
export function BusinessHoursEditor({ value, onChange }: { value: BusinessHours | null; onChange: (v: BusinessHours) => void }) {
  const { t } = useI18n();
  const hours = value ?? {};
  function setDay(day: string, next: { open: string; close: string } | null) {
    onChange({ ...hours, [day]: next });
  }
  return (
    <div className="space-y-1">
      {DAYS.map((d) => {
        const h = hours[d] ?? null;
        return (
          <div key={d} className="flex items-center gap-2 text-sm">
            <label className="flex w-28 items-center gap-2">
              <input type="checkbox" checked={!!h} onChange={(e) => setDay(d, e.target.checked ? { open: "08:00", close: "17:00" } : null)} />
              {t(d as "monday")}
            </label>
            {h && <>
              <input type="time" value={h.open} onChange={(e) => setDay(d, { ...h, open: e.target.value })}
                className="rounded border border-border bg-background p-1" />
              <span>–</span>
              <input type="time" value={h.close} onChange={(e) => setDay(d, { ...h, close: e.target.value })}
                className="rounded border border-border bg-background p-1" />
            </>}
          </div>
        );
      })}
    </div>
  );
}
