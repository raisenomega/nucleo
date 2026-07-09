import { useCallback, useEffect, useState } from "react";
import type {
  IRouteRepository, ServiceRoute, RouteStop, RouteFormData, StopFormData, StopPatch, EditableStop, CompletePayload,
} from "@operations/domain/route.types";

// DI del repo. Carga rutas del día + paradas de la ruta activa; mutaciones que refrescan.
export function useRoutes(repo: IRouteRepository, date: string) {
  const [routes, setRoutes] = useState<readonly ServiceRoute[]>([]);
  const [stops, setStops] = useState<readonly RouteStop[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const refresh = useCallback(async () => { setRoutes(await repo.listRoutes(date)); }, [repo, date]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (active) void repo.listStops(active).then(setStops); else setStops([]); }, [repo, active]);
  const reloadStops = useCallback(async () => { if (active) setStops(await repo.listStops(active)); }, [repo, active]);

  const create = useCallback(async (d: RouteFormData, s: StopFormData[]) => { const r = await repo.create(d, s); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const update = useCallback(async (id: string, d: RouteFormData) => { const r = await repo.update(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const voidRow = useCallback(async (id: string, reason: string) => { const r = await repo.voidRow(id, reason); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const updateStop = useCallback(async (id: string, p: StopPatch) => { const r = await repo.updateStop(id, p); if (r.ok) await reloadStops(); return r; }, [repo, reloadStops]);
  const removeStop = useCallback(async (id: string) => { const r = await repo.removeStop(id); if (r.ok) await reloadStops(); return r; }, [repo, reloadStops]);
  const recordPayment = useCallback(async (id: string, p: CompletePayload) => { const r = await repo.recordPayment(id, p); if (r.ok) { await reloadStops(); await refresh(); } return r; }, [repo, reloadStops, refresh]);
  const completeStop = useCallback(async (id: string) => { const r = await repo.completeStop(id); if (r.ok) { await reloadStops(); await refresh(); } return r; }, [repo, reloadStops, refresh]);
  const setNotAttended = useCallback(async (id: string, reason: string) => { const r = await repo.setNotAttended(id, reason); if (r.ok) { await reloadStops(); await refresh(); } return r; }, [repo, reloadStops, refresh]);
  // Diff al guardar edición: borra las quitadas, actualiza las existentes (orden = posición), agrega las nuevas.
  const syncStops = useCallback(async (routeId: string, drafts: EditableStop[], original: readonly RouteStop[]) => {
    const keep = new Set(drafts.map((d) => d.id).filter(Boolean));
    for (const o of original) if (!keep.has(o.id)) await repo.removeStop(o.id);
    for (const [i, d] of drafts.entries()) {
      if (d.id) await repo.updateStop(d.id, { ...d, stopOrder: i + 1 }); else await repo.addStop(routeId, i + 1, d);
    }
    await refresh(); await reloadStops();
  }, [repo, refresh, reloadStops]);

  return { routes, stops, active, setActive, create, update, voidRow, remove, updateStop, removeStop, recordPayment, completeStop, setNotAttended, syncStops };
}
