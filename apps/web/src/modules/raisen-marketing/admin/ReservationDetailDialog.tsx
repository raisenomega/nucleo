import { useState } from "react";
import { RES_STATUSES, RES_LABELS } from "@raisen-marketing/admin/reservation-constants";
import type { MarketingReservation, ReservationStatus } from "@raisen-marketing/data/reservation.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";
const Field = ({ k, v }: { k: string; v: string | null }) => v ? <p className="text-sm text-foreground"><span className="text-muted-foreground">{k}:</span> {v}</p> : null;

// Detalle de una reserva: datos del cliente + fecha/hora + cambiar status + notas internas → Guardar.
export function ReservationDetailDialog({ r, onClose, onSave }: { r: MarketingReservation; onClose: () => void; onSave: (patch: { status: ReservationStatus; notes: string }) => void }) {
  const [status, setStatus] = useState<ReservationStatus>(r.status);
  const [notes, setNotes] = useState(r.notes ?? "");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">{r.customerName}</h2>
        <div className="space-y-1">
          <Field k="Email" v={r.customerEmail} />
          <Field k="Teléfono" v={r.customerPhone} />
          <Field k="Fecha" v={`${r.reservationDate} · ${r.reservationTime} (${r.durationMinutes} min)`} />
          <Field k="Notas del cliente" v={r.notes} />
          <Field k="Creada" v={r.createdAt.replace("T", " ").slice(0, 16)} />
        </div>
        <label className="block text-sm text-muted-foreground">Status
          <select value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus)} className={F}>{RES_STATUSES.map((s) => <option key={s} value={s}>{RES_LABELS[s]}</option>)}</select>
        </label>
        <label className="block text-sm text-muted-foreground">Notas internas
          <textarea rows={3} className={F} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onSave({ status, notes })} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Guardar</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
