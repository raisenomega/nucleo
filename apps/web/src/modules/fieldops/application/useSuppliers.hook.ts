import { useCallback, useEffect, useState } from "react";
import type { Supplier, SupplierFormData, ISupplierRepository } from "@fieldops/domain/supplier.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure.
export function useSuppliers(repo: ISupplierRepository) {
  const [items, setItems] = useState<Supplier[]>([]);

  const refresh = useCallback(async () => {
    const r = await repo.list();
    setItems(r.ok ? r.value : []);
  }, [repo]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (d: SupplierFormData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const update = useCallback(async (id: string, d: SupplierFormData) => { const r = await repo.update(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await refresh(); return r; }, [repo, refresh]);

  return { items, create, update, remove, refresh };
}
