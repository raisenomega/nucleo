import { useCallback, useEffect, useState } from "react";
import type { CountFormData, InventoryCount, IInventoryCountRepository } from "@fieldops/domain/inventory-count.types";

// DI — recibe el repositorio inyectado. Expone lista + conteo seleccionado (con líneas) + acciones del flujo.
export function useInventoryCounts(repo: IInventoryCountRepository) {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [selected, setSelected] = useState<InventoryCount | null>(null);

  const refresh = useCallback(async () => { const r = await repo.list(); setCounts(r.ok ? r.value : []); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const selectCount = useCallback(async (id: string | null) => { setSelected(id ? await repo.getById(id) : null); }, [repo]);
  const reselect = useCallback(async () => { if (selected) setSelected(await repo.getById(selected.id)); }, [repo, selected]);

  const create = useCallback(async (d: CountFormData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const recordLine = useCallback(async (lineId: string, qty: number, notes?: string) => { const r = await repo.recordLine(lineId, qty, notes); if (r.ok) { await reselect(); await refresh(); } return r; }, [repo, reselect, refresh]);
  const approveLines = useCallback(async (cid: string, ids: string[], a: "approve" | "reject") => { const r = await repo.approveLines(cid, ids, a); if (r.ok) { await reselect(); await refresh(); } return r; }, [repo, reselect, refresh]);
  const apply = useCallback(async (cid: string) => { const r = await repo.apply(cid); if (r.ok) { await reselect(); await refresh(); } return r; }, [repo, reselect, refresh]);
  const cancel = useCallback(async (cid: string) => { const r = await repo.cancel(cid); if (r.ok) { await reselect(); await refresh(); } return r; }, [repo, reselect, refresh]);

  return { counts, selected, selectCount, create, recordLine, approveLines, apply, cancel, refresh };
}
