import { createContext, useContext } from "react";
import type { CustomerProfile } from "@shared/portal/customer.types";

// Provee el perfil del customer resuelto por el guard a las páginas del portal.
export interface PortalCtx { customer: CustomerProfile; refresh: () => Promise<void> }
export const PortalContext = createContext<PortalCtx | null>(null);

export function usePortal(): PortalCtx {
  const c = useContext(PortalContext);
  if (!c) throw new Error("usePortal debe usarse dentro del portal");
  return c;
}
