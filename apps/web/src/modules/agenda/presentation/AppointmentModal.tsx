import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useAppointmentForm } from "@agenda/presentation/appointment-modal.hooks";
import { LeadPickerSection } from "@agenda/presentation/LeadPickerSection";
import { LeadSelectedPreview } from "@agenda/presentation/AppointmentModalSections/LeadSelectedPreview";
import { ServicePickerSection } from "@agenda/presentation/AppointmentModalSections/ServicePickerSection";
import { MeetingLinkSection } from "@agenda/presentation/AppointmentModalSections/MeetingLinkSection";
import { NotifyClientToggle } from "@agenda/presentation/AppointmentModalSections/NotifyClientToggle";
import { useReservableServices } from "@agenda/application/useReservableServices.hook";
import { supabaseReservableServicesRepository } from "@agenda/infrastructure/supabase-reservable-services.repository";
import { findMatchingService } from "@agenda/utils/extract-service-from-lead";
import { buildInitialNotes } from "@agenda/utils/build-appointment-notes";
import { STATUS_LABEL, STATUSES } from "@agenda/presentation/appointment-status.const";
import type { Appointment, AppointmentInput, AppointmentStatus } from "@agenda/domain/appointment.types";
import type { ServiceInput } from "@agenda/domain/reservable-service.types";
import type { LeadLite } from "@agenda/domain/leads-lite.types";

export function AppointmentModal({ initial, defaultStart, onSave, onClose }: { initial?: Appointment; defaultStart?: string; onSave: (i: AppointmentInput) => Promise<void>; onClose: () => void }) {
  const { t } = useI18n();
  const { session } = useSession();
  const { form, set, canSave, linkOk, toInput } = useAppointmentForm(initial, defaultStart);
  const { list: services, create: createSvc } = useReservableServices(supabaseReservableServicesRepository, session?.tenantId);
  const [lead, setLead] = useState<LeadLite | null>(null);
  const [busy, setBusy] = useState(false);
  const hasEmail = ((lead?.email ?? initial?.leadEmail) ?? "").trim().length > 0;
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const cap = "mb-1 block text-sm font-medium";
  function pickService(id: string) { const s = services.find((x) => x.id === id); set("serviceId", id || null); if (s?.durationMinutes) set("duration", s.durationMinutes); }
  async function onCreateSvc(i: ServiceInput) { const s = await createSvc(i); if (s) { set("serviceId", s.id); if (s.durationMinutes) set("duration", s.durationMinutes); } }
  function onLead(l: LeadLite | null) {
    setLead(l); set("leadId", l?.id ?? null); set("leadName", l?.name ?? "");
    if (!l) return;
    const m = findMatchingService(l.serviceRequested, services); if (m) pickService(m.id);
    if (!form.notes.trim()) set("notes", buildInitialNotes(l));
  }
  async function submit() { setBusy(true); await onSave(toInput()); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("agendaNewAppointment")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 text-foreground">
        <label className="block"><span className={cap}>{t("agendaApptTitle")}</span><input value={form.title} onChange={(e) => set("title", e.target.value)} className={fld} /></label>
        <div><span className={cap}>{t("leads")}</span><LeadPickerSection leadId={form.leadId} leadName={form.leadName} onPick={onLead} />{lead && <LeadSelectedPreview lead={lead} />}</div>
        <ServicePickerSection services={services} value={form.serviceId} onChange={pickService} onCreate={onCreateSvc} />
        <div className="flex flex-wrap gap-3">
          <label className="block"><span className={cap}>{t("agendaStartsAt")}</span><input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={fld} /></label>
          <label className="block"><span className={cap}>{t("agendaDuration")}</span><input type="number" min={15} step={15} value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} className={`w-28 ${fld}`} /></label>
        </div>
        <label className="block"><span className={cap}>{t("agendaStatus")}</span>
          <select value={form.status} onChange={(e) => set("status", e.target.value as AppointmentStatus)} className={fld}>{STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}</select></label>
        <NotifyClientToggle checked={form.notifyClient} hasEmail={hasEmail} onChange={(v) => set("notifyClient", v)} />
        <label className="block"><span className={cap}>{t("agendaNotes")}</span><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={fld} /></label>
        <MeetingLinkSection value={form.meetingLink} invalid={!linkOk} onChange={(v) => set("meetingLink", v)} />
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
