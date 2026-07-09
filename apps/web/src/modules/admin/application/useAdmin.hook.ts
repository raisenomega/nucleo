import { useCallback, useEffect, useState } from "react";
import type {
  IAdminRepository, TeamMember, CategoryConfig, SettingEntry, InviteData, AppRole, UserStatus,
} from "@admin/domain/admin.types";

// DI del repo. Carga equipo + categorías + settings; expone mutaciones que refrescan.
export function useAdmin(repo: IAdminRepository) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [settings, setSettings] = useState<SettingEntry[]>([]);

  const refresh = useCallback(async () => {
    const [t, c, s] = await Promise.all([repo.listTeam(), repo.listCategories(), repo.listSettings()]);
    setTeam([...t]); setCategories([...c]); setSettings([...s]);
  }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const setStatus = useCallback(async (id: string, s: UserStatus) => { const r = await repo.setStatus(id, s); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const changeRole = useCallback(async (uid: string, role: AppRole) => { const r = await repo.changeRole(uid, role); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const invite = useCallback(async (d: InviteData) => { const r = await repo.invite(d); if (r.ok && !r.duplicated) await refresh(); return r; }, [repo, refresh]);
  const saveCategory = useCallback(async (id: string | null, kind: string, label: string, cls: string | null) => { const r = await repo.saveCategory(id, kind, label, cls); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const toggleCategory = useCallback(async (id: string, active: boolean) => { const r = await repo.toggleCategory(id, active); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const upsertSetting = useCallback(async (key: string, value: string) => { const r = await repo.upsertSetting(key, value); if (r.ok) await refresh(); return r; }, [repo, refresh]);

  return { team, categories, settings, refresh, setStatus, changeRole, invite, saveCategory, toggleCategory, upsertSetting };
}
