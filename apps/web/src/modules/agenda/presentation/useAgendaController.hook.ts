import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useToast } from "@shared/providers/toast-context";
import { useAppointments } from "@agenda/application/useAppointments.hook";
import { useSaveAppointment } from "@agenda/application/useSaveAppointment.hook";
import { useBlockedPeriods } from "@agenda/application/useBlockedPeriods.hook";
import { useAppointmentSettings } from "@agenda/application/useAppointmentSettings.hook";
import { supabaseAppointmentsRepository as ar } from "@agenda/infrastructure/supabase-appointments.repository";
import { supabaseBlockedPeriodsRepository as br } from "@agenda/infrastructure/supabase-blocked-periods.repository";
import { supabaseAppointmentSettingsRepository as sr } from "@agenda/infrastructure/supabase-appointment-settings.repository";
import { visibleHourRange } from "@agenda/utils/hour-range-calculator";
import { slotConflict } from "@agenda/utils/detect-slot-conflict";
import type { AppointmentInput } from "@agenda/domain/appointment.types";

// Controller de la página (presentación): carga datos + expone handlers. Undo en barra transitoria (toast no tiene acción).
export function useAgendaController() {
  const { t } = useI18n(); const { session } = useSession(); const toast = useToast();
  const { list: appts, reload, remove } = useAppointments(ar, "all");
  const { list: blocked } = useBlockedPeriods(br, session?.tenantId);
  const { settings } = useAppointmentSettings(sr, session?.tenantId);
  const { save } = useSaveAppointment(ar);
  const [undoFn, setUndoFn] = useState<(() => Promise<void>) | null>(null);
  const err = (c?: string) => t(c === "conflict" ? "agendaErrConflict" : c === "blocked" ? "agendaErrBlocked" : "agendaErrSave");
  async function saveApt(id: string | null, input: AppointmentInput) {
    const r = await save(id, input); if (r.ok) { toast.success(t("saved")); await reload(); return true; } toast.error(err(r.code)); return false;
  }
  async function reschedule(id: string, startMs: number) {
    const a = appts.find((x) => x.id === id); if (!a) return;
    const endMs = startMs + (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime());
    const c = slotConflict(startMs, endMs, appts, blocked, id); if (c) return toast.error(err(c));
    const base: AppointmentInput = { leadId: a.leadId, serviceId: a.serviceId, title: a.title, status: a.status, notes: a.notes, meetingLink: a.meetingLink, notifyClient: a.notifyClient, startsAt: new Date(startMs).toISOString(), endsAt: new Date(endMs).toISOString() };
    const prev = { startsAt: a.startsAt, endsAt: a.endsAt };
    const r = await save(id, base); if (!r.ok) return toast.error(err(r.code));
    await reload(); toast.success(t("agendaRescheduled"));
    setUndoFn(() => async () => { await save(id, { ...base, ...prev }); await reload(); setUndoFn(null); });
    setTimeout(() => setUndoFn(null), 10000);
  }
  async function removeApt(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await remove(id); if (!r.ok) toast.error(r.error); } }
  return { appts, blocked, hourRange: visibleHourRange(settings.weeklySchedule), saveApt, reschedule, removeApt, undoFn };
}
