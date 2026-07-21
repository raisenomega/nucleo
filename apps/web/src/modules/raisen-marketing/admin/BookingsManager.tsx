import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useToast } from "@shared/providers/toast-context";
import { useSuperAdmin } from "@shared/hooks/useSuperAdmin";
import { getReservations, setReservationFields, deleteReservation, emailReservation } from "@raisen-marketing/infrastructure/marketing-booking.repository";
import type { MarketingReservation, ReservationStatus } from "@raisen-marketing/data/reservation.types";
import { RES_STATUSES, RES_LABELS } from "@raisen-marketing/admin/reservation-constants";
import { ReservationRow } from "@raisen-marketing/admin/ReservationRow";
import { ReservationDetailDialog } from "@raisen-marketing/admin/ReservationDetailDialog";
import { EmailComposeDialog } from "@raisen-marketing/admin/EmailComposeDialog";
import { todayStr } from "@raisen-marketing/data/calendar-utils";

const SEL = "rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Inbox /web/reservas (Super Admin): reservas reales con filtros (status, desde hoy), cambio de status inline y
// detalle con notas. Escritura solo superadmin (RLS). El visitante NO puede leer las reservas.
export function BookingsManager() {
  const { isSuperAdmin } = useSuperAdmin();
  const toast = useToast();
  const [items, setItems] = useState<MarketingReservation[]>([]);
  const [f, setF] = useState<{ status: string; from: string }>({ status: "", from: "" });
  const [view, setView] = useState<MarketingReservation | null>(null);
  const [emailFor, setEmailFor] = useState<MarketingReservation | null>(null);
  const reload = (nf = f) => { void getReservations(nf).then(setItems); };
  useEffect(() => { reload(); }, []);
  if (!isSuperAdmin) return <Navigate to="/dashboard" />;
  const done = (e: string | null) => { if (e) toast.error(e); else reload(); };
  const setFilter = (p: Partial<typeof f>) => { const nf = { ...f, ...p }; setF(nf); reload(nf); };
  const saveDetail = async (patch: { status: ReservationStatus; notes: string }) => { const e = await setReservationFields(view!.id, patch); if (e) return toast.error(e); setView(null); toast.success("Guardado"); reload(); };
  return (
    <div className="max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Inbox · Reservas</h1>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-bold text-foreground">Reservas ({items.length})</h2>
        <select value={f.status} onChange={(e) => setFilter({ status: e.target.value })} className={SEL}><option value="">Todos</option>{RES_STATUSES.map((s) => <option key={s} value={s}>{RES_LABELS[s]}</option>)}</select>
        <button type="button" onClick={() => setFilter({ from: f.from ? "" : todayStr() })} className={`${SEL} ${f.from ? "text-primary" : ""}`}>{f.from ? "Desde hoy ✓" : "Desde hoy"}</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Sin reservas en esta vista.</p>}
        {items.map((r) => (
          <ReservationRow key={r.id} r={r} onStatus={(s) => void setReservationFields(r.id, { status: s }).then(done)} onView={() => setView(r)} onEmail={() => setEmailFor(r)}
            onDelete={() => { if (window.confirm(`¿Eliminar la reserva de "${r.customerName}"?`)) void deleteReservation(r.id).then(done); }} />
        ))}
      </div>
      {view && <ReservationDetailDialog r={view} onClose={() => setView(null)} onSave={saveDetail} />}
      {emailFor && <EmailComposeDialog toName={emailFor.customerName} toEmail={emailFor.customerEmail} defaultSubject="Tu demo en NÚCLEO" onClose={() => setEmailFor(null)} onSend={(s, b, cc, bcc) => emailReservation(emailFor.id, s, b, cc, bcc)} />}
    </div>
  );
}
