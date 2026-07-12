import { Plus, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

const VIEWS: [string, TranslationKey][] = [["list", "agendaViewList"], ["week", "agendaViewWeek"], ["month", "agendaViewMonth"]];

export function AgendaToolbar({ view, onView, onNew }: { view: string; onView: (v: string) => void; onNew: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div role="tablist" className="flex gap-1 rounded-lg border border-border p-1">
        {VIEWS.map(([v, k]) => <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => onView(v)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{t(k)}</button>)}
      </div>
      <div className="flex items-center gap-2">
        <Link to="/settings/agenda" aria-label={t("agendaConfig")} className="rounded-lg border border-border p-2"><Settings className="h-4 w-4" /></Link>
        <button type="button" onClick={onNew} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("agendaNewAppointment")}</button>
      </div>
    </div>
  );
}
