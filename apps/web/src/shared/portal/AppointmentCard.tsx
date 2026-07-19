import { useState } from "react";
import { Video } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { CustomerAppointment } from "@shared/portal/service.types";

// Cita: fecha/estado + link de videollamada + reagendar (mantiene duración) + cancelar.
export function AppointmentCard({ appt, onReschedule, onCancel }: {
  appt: CustomerAppointment; onReschedule: (id: string, s: string, e: string) => void; onCancel: (id: string) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(appt.startsAt.slice(0, 16));
  const dead = appt.status === "cancelada" || appt.status === "completada";
  const btn = "rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground";
  const save = () => {
    const s = new Date(start), e = new Date(s.getTime() + (new Date(appt.endsAt).getTime() - new Date(appt.startsAt).getTime()));
    onReschedule(appt.id, s.toISOString(), e.toISOString()); setEditing(false);
  };
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between"><span className="font-bold text-foreground">{appt.title || t("navAppointments")}</span><span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{appt.status}</span></div>
      <p className="text-sm text-muted-foreground">{appt.startsAt.slice(0, 16).replace("T", " ")}</p>
      {appt.meetingLink && <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary"><Video className="h-4 w-4" />{t("pJoinCall")}</a>}
      {!dead && !editing && <div className="flex gap-2"><button type="button" onClick={() => setEditing(true)} className={btn}>{t("pReschedule")}</button><button type="button" onClick={() => onCancel(appt.id)} className={`${btn} text-destructive`}>{t("pCancelAppt")}</button></div>}
      {editing && <div className="flex flex-wrap items-center gap-2"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" /><button type="button" onClick={save} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">{t("save")}</button><button type="button" onClick={() => setEditing(false)} className={btn}>{t("cancel")}</button></div>}
    </div>
  );
}
