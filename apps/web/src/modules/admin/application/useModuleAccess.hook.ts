import { useMemo } from "react";
import type { AppRole } from "@admin/domain/admin.types";
import { defaultsFor, type ModuleAccess, type Perm } from "@admin/domain/module-access";

// v1: gating derivado de role + override module_access. El enforcement en rutas se cablea despues.
// override null -> defaults del rol; con datos -> permisos especificos del empleado.
export function useModuleAccess(role: AppRole | null, override: ModuleAccess | null) {
  return useMemo(() => {
    const access: ModuleAccess = override ?? defaultsFor(role);
    return { access, can: (mod: string, perm: Perm = "view") => access[mod]?.[perm] === true };
  }, [role, override]);
}
