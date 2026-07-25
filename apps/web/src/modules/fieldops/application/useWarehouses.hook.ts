import { useCallback, useEffect, useMemo, useState } from "react";
import type { Warehouse, WarehouseFormData, IWarehouseRepository } from "@fieldops/domain/warehouse.types";

// DI — recibe el repositorio inyectado. Expone almacenes + el default + CRUD.
export function useWarehouses(repo: IWarehouseRepository) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const refresh = useCallback(async () => { const r = await repo.list(); setWarehouses(r.ok ? r.value : []); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);
  const defaultWarehouse = useMemo(() => warehouses.find((w) => w.isDefault) ?? null, [warehouses]);
  const create = useCallback(async (d: WarehouseFormData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const update = useCallback(async (id: string, d: WarehouseFormData) => { const r = await repo.update(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  return { warehouses, defaultWarehouse, create, update, remove, refresh };
}
