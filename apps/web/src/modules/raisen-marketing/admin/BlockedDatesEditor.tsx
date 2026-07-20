import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BlockedDate } from "@raisen-marketing/data/reservation.types";

const F = "rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Fechas bloqueadas (vacaciones/feriados): agregar fecha+motivo, listar, eliminar. /demo las oculta.
export function BlockedDatesEditor({ blocked, onAdd, onRemove }: {
  blocked: BlockedDate[]; onAdd: (date: string, reason: string) => void; onRemove: (id: string) => void;
}) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const add = () => { if (!date) return; onAdd(date, reason); setDate(""); setReason(""); };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="font-display text-lg font-bold text-foreground">Fechas bloqueadas</h2>
      <div className="flex flex-wrap gap-2">
        <input type="date" className={F} value={date} onChange={(e) => setDate(e.target.value)} />
        <input className={`${F} flex-1`} placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Bloquear</button>
      </div>
      <div className="space-y-1">
        {blocked.length === 0 && <p className="text-xs text-muted-foreground">Sin fechas bloqueadas.</p>}
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
            <span className="font-medium text-foreground">{b.blockedDate}</span>
            <span className="flex-1 truncate text-xs text-muted-foreground">{b.reason}</span>
            <button type="button" onClick={() => onRemove(b.id)} aria-label="eliminar" className="rounded p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
