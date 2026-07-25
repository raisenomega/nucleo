import { useCallback, useEffect, useState } from "react";
import type { CategoryMapping, ICategoryMappingRepository } from "@accounting/domain/category-mapping.types";

// DI del repo. Estado del mapeo categoría→cuenta + mutaciones que refrescan.
export function useCategoryMappings(repo: ICategoryMappingRepository) {
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const refresh = useCallback(async () => { setMappings(await repo.list()); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);
  const setAccount = useCallback(async (id: string, acc: string | null) => { const r = await repo.setAccount(id, acc); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const autoMap = useCallback(async (tid: string) => { const r = await repo.autoMap(tid); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  return { mappings, setAccount, autoMap, refresh };
}
