import { useCallback, useEffect, useState } from "react";
import type { IAppointmentsRepository, Appointment, Result } from "@agenda/domain/appointment.types";

export function useAppointments(repo: IAppointmentsRepository, status: string) {
  const [list, setList] = useState<Appointment[]>([]);
  const load = useCallback(async () => setList(await repo.list(status)), [repo, status]);
  useEffect(() => { void load(); }, [load]);
  const remove = useCallback(async (id: string): Promise<Result> => {
    const r = await repo.remove(id); if (r.ok) await load(); return r;
  }, [repo, load]);
  return { list, reload: load, remove };
}
