import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useObservations } from "@hr/application/useObservations.hook";
import { supabaseObservationRepository } from "@hr/infrastructure/supabase-observation.repository";
import { ObservationForm } from "@hr/presentation/ObservationForm";
import { ObservationTable } from "@hr/presentation/ObservationTable";

export const Route = createFileRoute("/_authenticated/observations")({ component: ObservationsPage });
type Emp = { id: string; full_name: string };

function ObservationsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const m = useObservations(supabaseObservationRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [creating, setCreating] = useState(false);
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? [])); }, []);
  if (!can("observations", "view")) return <Navigate to="/dashboard" />;
  const del = (id: string) => { if (window.confirm(`${t("delete")}?`)) void m.remove(id); };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("observations")}</h1>
          {can("observations", "create") && (
            <button type="button" onClick={() => setCreating((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
              <Plus className="h-4 w-4" /> {t("newObservation")}</button>)}
        </div>
        <p className="text-xs text-muted-foreground">{t("observationsSubtitle")}</p>
      </div>
      {creating && <ObservationForm employees={emps} onSubmit={m.save} onCancel={() => setCreating(false)} />}
      <ObservationTable rows={m.list} onDelete={can("observations", "delete") ? del : undefined} />
    </div>
  );
}
