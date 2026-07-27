import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { listGeofences, saveGeofence, deleteGeofence, listGeofenceEvents, type Geofence, type GeofenceEventRow } from "@assets/infrastructure/geofence.repository";
import { GeofenceTable } from "@assets/presentation/GeofenceTable";
import { GeofenceForm } from "@assets/presentation/GeofenceForm";
import { GeofenceEvents } from "@assets/presentation/GeofenceEvents";

// Tab Geocercas: alta/edición/borrado + historial de eventos. Escrituras gateadas por RLS (assets.edit).
export function GeofencesTab() {
  const { t } = useI18n();
  const { session } = useSession();
  const [rows, setRows] = useState<Geofence[]>([]);
  const [events, setEvents] = useState<GeofenceEventRow[]>([]);
  const [editing, setEditing] = useState<Geofence | null | undefined>(undefined);
  const load = () => { void listGeofences().then(setRows); void listGeofenceEvents().then(setEvents); };
  useEffect(load, []);
  const save = async (f: Record<string, unknown>) => {
    const extra = editing ? {} : { tenant_id: session?.tenantId, created_by: session?.userId };
    await saveGeofence(editing?.id ?? null, { ...f, ...extra });
    setEditing(undefined); load();
  };
  const del = async (id: string) => { if (window.confirm(t("confirmDelete"))) { await deleteGeofence(id); load(); } };
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("newGeofence")}</button>
      </div>
      <GeofenceTable rows={rows} onEdit={setEditing} onDelete={del} />
      {events.length > 0 && <div className="space-y-2"><h3 className="text-sm font-bold text-foreground">{t("geofenceEvents")}</h3><GeofenceEvents rows={events} /></div>}
      {editing !== undefined && <GeofenceForm initial={editing ?? undefined} onSave={save} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
