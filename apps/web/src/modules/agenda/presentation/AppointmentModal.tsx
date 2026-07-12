import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useAppointmentForm } from "@agenda/presentation/appointment-modal.hooks";
import { LeadPickerSection } from "@agenda/presentation/LeadPickerSection";
import { useReservableServices } from "@agenda/application/useReservableServices.hook";
import { supabaseReservableServicesRepository } from "@agenda/infrastructure/supabase-reservable-services.repository";
import type { Appointment, AppointmentInput, AppointmentStatus } from "@agenda/domain/appointment.types";

import { STATUS_LABEL, STATUSES } from "@agenda/presentation/appointment-status.const";

export function AppointmentModal({ initial, defaultStart, onSave, onClose }: { initial?: Appointment; defaultStart?: string; onSave: (i: AppointmentInput) => Promise<void>; onClose: () => void }) {
  const { t } = useI18n();
  const { form, set, canSave, toInput } = useAppointmentForm(initial, defaultStart);
  const { list: services } = useReservableServices(supabaseReservableServicesRepository);
  const [busy, setBusy] = useState(false);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const cap = "mb-1 block text-sm font-medium";
  function pickService(id: string) { const s = services.find((x) => x.id === id); set("serviceId", id || null); if (s?.durationMinutes) set("duration", s.durationMinutes); }
  async function submit() { setBusy(true); await onSave(toInput()); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("agendaNewAppointment")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 text-foreground">
        <label className="block"><span className={cap}>{t("agendaApptTitle")}</span><input value={form.title} onChange={(e) => set("title", e.target.value)} className={fld} /></label>
        <div><span className={cap}>{t("leads")}</span><LeadPickerSection leadId={form.leadId} leadName={form.leadName} onPick={(id, name) => { set("leadId", id); set("leadName", name); }} /></div>
        <div><span className={cap}>{t("agendaService")}</span>
          <div className="flex items-center gap-2">
            <select value={form.serviceId ?? ""} onChange={(e) => pickService(e.target.value)} className={`flex-1 ${fld}`}><option value="">—</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <Link to="/settings/landing/services" className="shrink-0 whitespace-nowrap text-sm text-primary">+ {t("agendaNewService")}</Link>
          </div></div>
        <div className="flex flex-wrap gap-3">
          <label className="block"><span className={cap}>{t("agendaStartsAt")}</span><input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={fld} /></label>
          <label className="block"><span className={cap}>{t("agendaDuration")}</span><input type="number" min={15} step={15} value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} className={`w-28 ${fld}`} /></label>
        </div>
        <label className="block"><span className={cap}>{t("agendaStatus")}</span>
          <select value={form.status} onChange={(e) => set("status", e.target.value as AppointmentStatus)} className={fld}>{STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}</select></label>
        <label className="block"><span className={cap}>{t("agendaNotes")}</span><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={fld} /></label>
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
