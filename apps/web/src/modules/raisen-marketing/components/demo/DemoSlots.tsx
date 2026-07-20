import { Clock, CalendarDays } from "lucide-react";

// Grid de horas de la fecha elegida. Placeholder si no hay fecha / sin slots. Los slots vienen del RPC.
export function DemoSlots({ slots, hasDate, loading, selected, onPick, es }: {
  slots: string[]; hasDate: boolean; loading: boolean; selected: string | null; onPick: (t: string) => void; es: boolean;
}) {
  const ph = (Icon: typeof Clock, text: string) => (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground"><Icon className="h-8 w-8 opacity-30" /><p className="text-sm">{text}</p></div>
  );
  if (!hasDate) return ph(CalendarDays, es ? "Elige primero una fecha" : "Pick a date first");
  if (loading) return ph(Clock, "…");
  if (slots.length === 0) return ph(Clock, es ? "No hay horarios disponibles" : "No available times");
  return (
    <div className="grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto">
      {slots.map((s) => (
        <button key={s} type="button" onClick={() => onPick(s)}
          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm transition-colors ${selected === s ? "border-primary bg-primary font-bold text-primary-foreground" : "border-border bg-card hover:border-primary hover:bg-primary/5"}`}>
          <Clock size={14} /> {s}
        </button>
      ))}
    </div>
  );
}
