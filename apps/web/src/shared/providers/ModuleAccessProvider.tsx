import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";
import { defaultsFor, type ModuleAccess, type Perm } from "@admin/domain/module-access";
import type { AppRole } from "@admin/domain/admin.types";

export type ModuleAccessValue = { can: (mod: string, perm?: Perm) => boolean; access: ModuleAccess };
export const ModuleAccessContext = createContext<ModuleAccessValue | null>(null);

// Gate real: llama get_my_module_access() UNA vez. override null -> defaults del rol; con datos -> permisos del empleado.
export function ModuleAccessProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [override, setOverride] = useState<ModuleAccess | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void supabase.rpc("get_my_module_access").then(({ data }) => {
      setOverride((data as ModuleAccess | null) ?? null); setReady(true);
    });
  }, []);
  const value = useMemo<ModuleAccessValue>(() => {
    const access = override ?? defaultsFor((session?.role as AppRole | null) ?? null);
    return { access, can: (mod, perm = "view") => access[mod]?.[perm] === true };
  }, [override, session?.role]);
  if (!ready) return <div className="grid min-h-screen place-items-center bg-background font-body text-sm text-muted-foreground">…</div>;
  return <ModuleAccessContext.Provider value={value}>{children}</ModuleAccessContext.Provider>;
}
