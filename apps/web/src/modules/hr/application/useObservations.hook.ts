import { useCallback, useEffect, useState } from "react";
import type { IObservationRepository, Observation, ObsCategory } from "@hr/domain/observation.types";

export function useObservations(repo: IObservationRepository) {
  const [list, setList] = useState<Observation[]>([]);
  const load = useCallback(async () => { setList(await repo.list()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (employeeId: string, category: ObsCategory, notes: string, followUp: string | null) => {
    const r = await repo.save(employeeId, category, notes, followUp); if (r.ok) await load(); return r;
  }, [repo, load]);
  const remove = useCallback(async (id: string) => { const r = await repo.remove(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { list, save, remove };
}
