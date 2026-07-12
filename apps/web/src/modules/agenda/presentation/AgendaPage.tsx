import { useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useAgendaController } from "@agenda/presentation/useAgendaController.hook";
import { AgendaToolbar } from "@agenda/presentation/AgendaToolbar";
import { AgendaViews } from "@agenda/presentation/AgendaViews";
import { AppointmentModal } from "@agenda/presentation/AppointmentModal";
import { getMondayOf, localDate, pad } from "@agenda/utils/week-navigation";
import type { Appointment, AppointmentInput } from "@agenda/domain/appointment.types";

type Search = { view?: string; week?: string; month?: string };
const mondayFrom = (s?: string) => { if (!s) return getMondayOf(new Date()); const [y, m, d] = s.split("-"); return getMondayOf(new Date(Number(y), Number(m) - 1, Number(d))); };
const monthFrom = (s?: string) => { const n = new Date(); if (!s) return new Date(n.getFullYear(), n.getMonth(), 1); const [y, m] = s.split("-"); return new Date(Number(y), Number(m) - 1, 1); };

export function AgendaPage({ search, onSearch }: { search: Search; onSearch: (p: Search) => void }) {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const c = useAgendaController();
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  const view = search.view ?? "list";
  async function onSave(input: AppointmentInput) { if (await c.saveApt(editing?.id ?? null, input)) { setEditing(null); setCreating(null); } }
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("agenda")}</h1>
      <AgendaToolbar view={view} onView={(v) => onSearch({ view: v })} onNew={() => setCreating("")} />
      {c.undoFn && <div className="flex items-center gap-3 rounded-lg bg-secondary p-2 text-sm"><span>{t("agendaRescheduled")}</span><button type="button" onClick={() => void c.undoFn?.()} className="font-bold text-foreground underline">{t("agendaUndo")}</button></div>}
      <AgendaViews view={view} monday={mondayFrom(search.week)} month={monthFrom(search.month)} hourRange={c.hourRange} appts={c.appts} blocked={c.blocked}
        onEdit={setEditing} onDelete={c.removeApt} onCreate={(day, mm) => setCreating(`${localDate(day)}T${pad(Math.floor(mm / 60))}:${pad(mm % 60)}`)} onReschedule={c.reschedule}
        onWeek={(d) => onSearch({ week: localDate(getMondayOf(d)) })} onMonth={(d) => onSearch({ month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` })} onDay={(d) => onSearch({ view: "week", week: localDate(getMondayOf(d)) })} />
      {(creating !== null || editing) && <AppointmentModal initial={editing ?? undefined} defaultStart={creating ?? undefined} onSave={onSave} onClose={() => { setCreating(null); setEditing(null); }} />}
    </div>
  );
}
