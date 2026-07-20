import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BlockedDate } from "@raisen-marketing/data/reservation.types";

const F = "rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Bloqueos: día COMPLETO o FRANJA horaria [inicio, fin). /demo resta ambos de los slots disponibles.
export function BlockedDatesEditor({ blocked, onAdd, onRemove }: {
  blocked: BlockedDate[]; onAdd: (date: string, reason: string, start?: string, end?: string) => void; onRemove: (id: string) => void;
}) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [full, setFull] = useState(true);
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("14:00");
  const add = () => {
    if (!date || (!full && start >= end)) return;
    onAdd(date, reason, full ? undefined : start, full ? undefined : end);
    setDate(""); setReason("");
  };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-display text-lg font-bold text-foreground">Fechas bloqueadas</h2>
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" className={F} value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} />día completo</label>
        {!full && <><input type="time" className={F} value={start} onChange={(e) => setStart(e.target.value)} /><span className="text-xs text-muted-foreground">a</span><input type="time" className={F} value={end} onChange={(e) => setEnd(e.target.value)} /></>}
        <input className={`${F} flex-1`} placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Bloquear</button>
      </div>
      {!full && start >= end && <p className="text-xs text-destructive">La hora de fin debe ser mayor que la de inicio.</p>}
      <div className="space-y-1">
        {blocked.length === 0 && <p className="text-xs text-muted-foreground">Sin fechas bloqueadas.</p>}
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
            <span className="font-medium text-foreground">{b.blockedDate}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{b.startTime ? `${b.startTime}–${b.endTime}` : "día completo"}</span>
            <span className="flex-1 truncate text-xs text-muted-foreground">{b.reason}</span>
            <button type="button" onClick={() => onRemove(b.id)} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
