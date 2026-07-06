import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { useRoutes } from "@operations/application/useRoutes.hook";
import { supabaseRouteRepository } from "@operations/infrastructure/supabase-route.repository";
import { RouteForm } from "@operations/presentation/RouteForm";
import { RouteTable } from "@operations/presentation/RouteTable";
import { RouteDetail } from "@operations/presentation/RouteDetail";
import type { RouteFormData, EditableStop, CompletePayload } from "@operations/domain/route.types";

export const Route = createFileRoute("/_authenticated/routes")({ component: RoutesPage });
type Emp = { id: string; full_name: string };

function RoutesPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const m = useRoutes(supabaseRouteRepository, date);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? [])); }, []);

  async function submit(d: RouteFormData, stops: EditableStop[]) {
    const editId = editing && editing !== "new" ? editing : null;
    const r = editId ? await m.update(editId, d) : await m.create(d, stops);
    if (r.ok && editId) await m.syncStops(editId, stops, m.stops);
    window.alert(r.ok ? "Guardado exitoso" : r.error); if (r.ok) setEditing(null);
  }
  const doComplete = (id: string, p: CompletePayload) => void m.completeStop(id, p).then((r) => { if (!r.ok) window.alert(r.error); });
  const doNotAttended = (id: string, reason: string) => void m.setNotAttended(id, reason).then((r) => { if (!r.ok) window.alert(r.error); });
  const doEvidence = (id: string, paths: string[]) => void m.updateStop(id, { evidenceUrls: paths });
  if (!can("routes", "view")) return <Navigate to="/dashboard" />;
  const cur = m.routes.find((r) => r.id === editing);
  const initial = cur ? { routeDate: cur.routeDate, assignedTo: cur.assignedTo, status: cur.status, notes: cur.notes ?? "" } : undefined;
  const viewRoute = m.routes.find((r) => r.id === viewing);
  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-primary">{t("routes")}</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />
          {can("routes", "create") && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold"><Plus className="h-4 w-4" /> {t("newRoute")}</button>}
        </div>
      </div>
      {editing !== null && <RouteForm key={editing} employees={emps} initial={initial}
        initialStops={editing !== "new" ? m.stops : undefined} onSubmit={submit} onCancel={() => setEditing(null)} />}
      <RouteTable rows={m.routes} employees={emps} onView={(id) => { setViewing(id); m.setActive(id); }}
        onEdit={can("routes", "edit") ? (id) => { setEditing(id); m.setActive(id); } : undefined}
        onDelete={can("routes", "delete") ? (id) => { if (window.confirm(`${t("delete")}?`)) void m.remove(id); } : undefined} />
      {viewRoute && <RouteDetail route={viewRoute} stops={m.stops} employees={emps} tenantId={session?.tenantId ?? ""} onClose={() => setViewing(null)}
        onComplete={doComplete} onNotAttended={doNotAttended} onEvidence={doEvidence}
        onEdit={can("routes", "edit") ? () => { setEditing(viewRoute.id); m.setActive(viewRoute.id); setViewing(null); } : undefined} />}
    </div>
  );
}
