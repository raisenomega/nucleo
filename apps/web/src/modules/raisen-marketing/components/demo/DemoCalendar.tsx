import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthGrid, todayStr, maxStr } from "@raisen-marketing/data/calendar-utils";

const WD = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Calendario custom (grid de mes, sin libs). Deshabilita: pasado, fuera de ventana (+30d), día no hábil
// (available_days 0=Dom..6=Sáb) y fechas bloqueadas. El RPC re-valida server-side (esto es solo UX).
export function DemoCalendar({ availableDays, blocked, selected, onSelect }: {
  availableDays: number[]; blocked: string[]; selected: string | null; onSelect: (d: string) => void;
}) {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = todayStr(), max = maxStr(30);
  const { leading, cells } = monthGrid(view.y, view.m);
  const shift = (delta: number) => setView(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const enabled = (c: { dateStr: string; dow: number }) => c.dateStr >= today && c.dateStr <= max && availableDays.includes(c.dow) && !blocked.includes(c.dateStr);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="mes anterior" className="rounded p-1 text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium text-foreground">{MONTHS[view.m]} {view.y}</span>
        <button type="button" onClick={() => shift(1)} aria-label="mes siguiente" className="rounded p-1 text-muted-foreground hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WD.map((d, i) => <span key={i} className="text-muted-foreground">{d}</span>)}
        {Array.from({ length: leading }).map((_, i) => <span key={`b${i}`} />)}
        {cells.map((c) => {
          const on = enabled(c), sel = selected === c.dateStr;
          return <button key={c.dateStr} type="button" disabled={!on} onClick={() => onSelect(c.dateStr)}
            className={`aspect-square rounded-md text-sm ${sel ? "bg-primary font-bold text-primary-foreground" : on ? "text-foreground hover:bg-primary/10" : "cursor-default text-muted-foreground/30"}`}>{c.day}</button>;
        })}
      </div>
    </div>
  );
}
