import { Eye } from "lucide-react";
import { RES_STATUSES, RES_LABELS, RES_COLORS } from "@raisen-marketing/admin/reservation-constants";
import type { MarketingReservation, ReservationStatus } from "@raisen-marketing/data/reservation.types";

// Fila de una reserva: fecha+hora · nombre/email · status select inline · ver detalle.
export function ReservationRow({ r, onStatus, onView }: {
  r: MarketingReservation; onStatus: (s: ReservationStatus) => void; onView: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="w-24 shrink-0 text-xs text-foreground"><p className="font-medium">{r.reservationDate}</p><p className="text-muted-foreground">{r.reservationTime}</p></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{r.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">{r.customerEmail}</p>
      </div>
      <select value={r.status} onChange={(e) => onStatus(e.target.value as ReservationStatus)} className={`shrink-0 rounded-full border px-2 py-1 text-xs ${RES_COLORS[r.status]}`}>
        {RES_STATUSES.map((s) => <option key={s} value={s} className="bg-card text-foreground">{RES_LABELS[s]}</option>)}
      </select>
      <button type="button" onClick={onView} aria-label="ver" className="rounded p-1 text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
    </div>
  );
}
