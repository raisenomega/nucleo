import { useCallback, useEffect, useState } from "react";
import type {
  IAdminRepository, TeamMemberDetail, TeamMemberUpdate, AppRole, UserStatus,
} from "@admin/domain/admin.types";

// DI del repo. Carga UN empleado (detalle) y expone sus mutaciones (evita cargar categorías/settings).
export function useTeamMember(repo: IAdminRepository, userId: string) {
  const [member, setMember] = useState<TeamMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMember(await repo.getTeamMember(userId));
    setLoading(false);
  }, [repo, userId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (d: TeamMemberUpdate) => { const r = await repo.updateTeamMember(userId, d); if (r.ok) await refresh(); return r; }, [repo, userId, refresh]);
  const setStatus = useCallback(async (s: UserStatus) => { const r = await repo.setStatus(userId, s); if (r.ok) await refresh(); return r; }, [repo, userId, refresh]);
  const changeRole = useCallback(async (role: AppRole) => { const r = await repo.changeRole(userId, role); if (r.ok) await refresh(); return r; }, [repo, userId, refresh]);
  const setPin = useCallback((pin: string) => repo.setPin(userId, pin), [repo, userId]);

  return { member, loading, save, setStatus, changeRole, setPin };
}
