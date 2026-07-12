import { useState } from "react";
import { Navigate, Link } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useAppointments } from "@agenda/application/useAppointments.hook";
import { useSaveAppointment } from "@agenda/application/useSaveAppointment.hook";
import { supabaseAppointmentsRepository } from "@agenda/infrastructure/supabase-appointments.repository";
import { AppointmentListView } from "@agenda/presentation/AppointmentListView";
import { AppointmentModal } from "@agenda/presentation/AppointmentModal";
import { STATUSES, STATUS_LABEL } from "@agenda/presentation/appointment-status.const";
import type { Appointment, AppointmentInput } from "@agenda/domain/appointment.types";

const ERR: Record<string, "agendaErrConflict" | "agendaErrBlocked" | "agendaErrSave"> = { conflict: "agendaErrConflict", blocked: "agendaErrBlocked" };

export function AgendaPage() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const [status, setStatus] = useState("all");
  const { list, reload, remove } = useAppointments(supabaseAppointmentsRepository, status);
  const { save } = useSaveAppointment(supabaseAppointmentsRepository);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  async function onSave(input: AppointmentInput) {
    const r = await save(editing?.id ?? null, input);
    if (r.ok) { toast.success(t("saved")); setCreating(false); setEditing(null); await reload(); }
    else toast.error(t(ERR[r.code ?? ""] ?? "agendaErrSave"));
  }
  async function onDelete(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await remove(id); if (!r.ok) toast.error(r.error); } }
  const chip = (v: string) => `rounded-full px-3 py-1 text-xs font-medium ${status === v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`;
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("agenda")}</h1>
        <div className="flex items-center gap-2">
          <Link to="/settings/agenda" aria-label={t("agendaConfig")} className="rounded-lg border border-border p-2"><Settings className="h-4 w-4" /></Link>
          <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("agendaNewAppointment")}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStatus("all")} className={chip("all")}>{t("agendaFilterAll")}</button>
        {STATUSES.map((s) => <button key={s} type="button" onClick={() => setStatus(s)} className={chip(s)}>{t(STATUS_LABEL[s])}</button>)}
      </div>
      <AppointmentListView list={list} onEdit={setEditing} onDelete={onDelete} />
      {(creating || editing) && <AppointmentModal initial={editing ?? undefined} onSave={onSave} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
