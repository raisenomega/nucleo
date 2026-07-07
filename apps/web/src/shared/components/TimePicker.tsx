import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Reloj numérico (sin aguja redonda): hora 1-12, minuto 0-59, AM/PM + borrar.
// value/onChange en formato "HH:MM" 24h ("" = sin hora).
export function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const has = /^\d{2}:\d{2}$/.test(value);
  const h24 = has ? parseInt(value.slice(0, 2), 10) : 0;
  const min = has ? parseInt(value.slice(3, 5), 10) : 0;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const emit = (H12: number, M: number, ap: string) => {
    const hh = (H12 % 12) + (ap === "PM" ? 12 : 0);
    onChange(`${String(hh).padStart(2, "0")}:${String(M).padStart(2, "0")}`);
  };
  const clamp = (v: string, lo: number, hi: number) => Math.min(hi, Math.max(lo, parseInt(v, 10) || lo));
  const f = "w-14 rounded-lg border border-border bg-background p-2 text-center text-sm";
  return (
    <div className="flex items-center gap-1">
      <input type="number" min={1} max={12} value={has ? h12 : ""} placeholder="12"
        onChange={(e) => emit(clamp(e.target.value, 1, 12), min, ampm)} className={f} />
      <span className="font-bold">:</span>
      <input type="number" min={0} max={59} value={has ? min : ""} placeholder="00"
        onChange={(e) => emit(has ? h12 : 12, clamp(e.target.value, 0, 59), ampm)} className={f} />
      <button type="button" onClick={() => emit(has ? h12 : 12, min, ampm === "AM" ? "PM" : "AM")}
        className="rounded-lg border border-border px-3 py-2 text-sm font-bold">{ampm}</button>
      {has && <button type="button" onClick={() => onChange("")} aria-label={t("delete")} className="text-muted-foreground"><X className="h-4 w-4" /></button>}
    </div>
  );
}
