import { useCallback, useEffect, useState } from "react";
import type { InventoryItem, InventoryFormData, RestockData, IInventoryRepository } from "@fieldops/domain/inventory.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useInventory(repo: IInventoryRepository) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const r = await repo.list();
    setItems(r.ok ? r.value : []);
    setIsLoading(false);
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (d: InventoryFormData) => {
    const r = await repo.create(d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const update = useCallback(async (id: string, d: InventoryFormData) => {
    const r = await repo.update(id, d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const remove = useCallback(async (id: string) => {
    const r = await repo.remove(id);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const restock = useCallback(async (id: string, d: RestockData) => {
    const r = await repo.restock(id, d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  return { items, isLoading, create, update, remove, restock, refresh };
}
