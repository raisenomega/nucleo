import { useCallback, useEffect, useState } from "react";
import type { IMonthClosureRepository, MonthClosure } from "@finance/domain/month-closure.types";

// Carga los cierres del tenant + expone close/reopen (recargan la lista al éxito). La lista de meses a mostrar
// la arma el panel (últimos N meses); este hook solo aporta cuáles están cerrados y las acciones.
export function useMonthClosures(repo: IMonthClosureRepository) {
  const [closures, setClosures] = useState<MonthClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => { setClosures(await repo.listClosures()); setLoading(false); }, [repo]);
  useEffect(() => { void reload(); }, [reload]);

  const close = useCallback(async (y: number, m: number) => {
    const r = await repo.close(y, m); if (r.ok) await reload(); return r;
  }, [repo, reload]);
  const reopen = useCallback(async (y: number, m: number, reason: string) => {
    const r = await repo.reopen(y, m, reason); if (r.ok) await reload(); return r;
  }, [repo, reload]);

  return { closures, loading, reload, close, reopen, preview: repo.preview.bind(repo) };
}
