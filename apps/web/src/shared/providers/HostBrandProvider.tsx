import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { brandByHostname, readHostBrand, writeHostBrand, type HostBrand } from "@shared/lib/brand-host";
import { applyBranding } from "@shared/lib/apply-branding";

const HostBrandContext = createContext<HostBrand | null>(null);
export const useHostBrand = (): HostBrand | null => useContext(HostBrandContext);

// Aplica el branding público (colores + título + favicon). Reusa applyBranding (theme parcial).
function apply(b: HostBrand): void {
  applyBranding({
    tenantId: b.tenant_id ?? "host", displayName: b.display_name, legalName: b.legal_name ?? b.display_name,
    theme: {
      primaryColor: b.primary_color, secondaryColor: null, accentColor: b.accent_color, sidebarBg: null,
      sidebarText: null, sidebarHover: null, dangerColor: null, successColor: null, warningColor: null, defaultMode: null,
    },
    faviconUrl: b.favicon_url ?? b.logo_url, // sin favicon dedicado → usa el logo del tenant
  });
}

// Resuelve el tenant por window.location.hostname. SSR-safe: init null (matchea SSR), todo en useEffect.
export function HostBrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<HostBrand | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = readHostBrand(); // localStorage post-hidratación (no en el init → sin mismatch)
    if (cached) { setBrand(cached); apply(cached); }
    void brandByHostname(window.location.hostname).then((fresh) => { setBrand(fresh); apply(fresh); writeHostBrand(fresh); });
  }, []);
  return <HostBrandContext.Provider value={brand}>{children}</HostBrandContext.Provider>;
}
