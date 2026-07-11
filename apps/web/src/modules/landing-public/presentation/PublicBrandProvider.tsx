import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { applyBranding } from "@shared/lib/apply-branding";
import { resolvePublicBrand } from "@landing-public/infrastructure/public-brand.resolver";
import type { PublicBrand, PublicBrandState } from "@landing-public/domain/public-brand.types";

export const PublicBrandContext = createContext<PublicBrandState>({ status: "loading" });

function apply(b: PublicBrand): void {
  applyBranding({
    tenantId: b.tenantId, displayName: b.displayName, legalName: b.displayName,
    theme: { primaryColor: b.primaryColor, secondaryColor: null, accentColor: b.accentColor, sidebarBg: null,
      sidebarText: null, sidebarHover: null, dangerColor: null, successColor: null, warningColor: null, defaultMode: null },
    faviconUrl: b.faviconUrl,
  });
}

// Resuelve el tenant por window.location.hostname (client-side, SSR-safe: init loading). Sin auth.
export function PublicBrandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicBrandState>({ status: "loading" });
  useEffect(() => {
    if (typeof window === "undefined") return;
    void resolvePublicBrand(window.location.hostname).then((b) => {
      if (b) { apply(b); setState({ status: "ready", brand: b }); } else setState({ status: "fallback" });
    });
  }, []);
  return <PublicBrandContext.Provider value={state}>{children}</PublicBrandContext.Provider>;
}
