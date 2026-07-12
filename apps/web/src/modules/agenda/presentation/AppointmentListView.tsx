import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { STATUS_LABEL, STATUS_COLOR, STATUSES } from "@agenda/presentation/appointment-status.const";
import type { Appointment } from "@agenda/domain/appointment.types";

const fmt = (s: string) => new Date(s).toLocaleString();

export function AppointmentListView({ list, onEdit, onDelete }: { list: Appointment[]; onEdit: (a: Appointment) => void; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  const [status, setStatus] = useState("all");
  const filtered = status === "all" ? list : list.filter((a) => a.status === status);
  const chip = (v: string) => `rounded-full px-3 py-1 text-xs font-medium ${status === v ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStatus("all")} className={chip("all")}>{t("agendaFilterAll")}</button>
        {STATUSES.map((s) => <button key={s} type="button" onClick={() => setStatus(s)} className={chip(s)}>{t(STATUS_LABEL[s])}</button>)}
      </div>
      <div className="rounded-lg border border-border">
      {filtered.map((a) => (
        <div key={a.id} onClick={() => onEdit(a)} className="flex cursor-pointer items-center gap-3 border-t border-border p-3 text-sm transition-colors first:border-0 hover:bg-secondary">
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLOR[a.status]}`} aria-hidden />
          <span className="hidden w-40 shrink-0 text-muted-foreground sm:inline">{fmt(a.startsAt)}</span>
          <span className="flex-1 font-medium text-foreground">{a.title}</span>
          <span className="hidden text-xs text-muted-foreground md:inline">{a.leadName || ""}{a.serviceName ? ` · ${a.serviceName}` : ""}</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs">{t(STATUS_LABEL[a.status])}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(a.id); }} aria-label={t("delete")} className="text-destructive">×</button>
        </div>))}
      {filtered.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("agendaNoAppointments")}</p>}
      </div>
    </div>
  );
}
