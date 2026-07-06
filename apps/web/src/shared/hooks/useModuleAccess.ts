import { useContext } from "react";
import { ModuleAccessContext } from "@shared/providers/ModuleAccessProvider";

// Lee el gate del context (RPC cacheado 1 vez). can("income","create") -> boolean.
export function useModuleAccess() {
  const ctx = useContext(ModuleAccessContext);
  if (!ctx) throw new Error("useModuleAccess debe usarse dentro de ModuleAccessProvider");
  return ctx;
}
