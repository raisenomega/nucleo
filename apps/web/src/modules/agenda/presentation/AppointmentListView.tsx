import { useI18n } from "@shared/i18n";
import { STATUS_LABEL, STATUS_COLOR } from "@agenda/presentation/appointment-status.const";
import type { Appointment } from "@agenda/domain/appointment.types";

const fmt = (s: string) => new Date(s).toLocaleString();

export function AppointmentListView({ list, onEdit, onDelete }: { list: Appointment[]; onEdit: (a: Appointment) => void; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-border">
      {list.map((a) => (
        <div key={a.id} onClick={() => onEdit(a)} className="flex cursor-pointer items-center gap-3 border-t border-border p-3 text-sm transition-colors first:border-0 hover:bg-secondary">
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLOR[a.status]}`} aria-hidden />
          <span className="hidden w-40 shrink-0 text-muted-foreground sm:inline">{fmt(a.startsAt)}</span>
          <span className="flex-1 font-medium text-foreground">{a.title}</span>
          <span className="hidden text-xs text-muted-foreground md:inline">{a.leadName || ""}{a.serviceName ? ` · ${a.serviceName}` : ""}</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs">{t(STATUS_LABEL[a.status])}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(a.id); }} aria-label={t("delete")} className="text-destructive">×</button>
        </div>))}
      {list.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("agendaNoAppointments")}</p>}
    </div>
  );
}
