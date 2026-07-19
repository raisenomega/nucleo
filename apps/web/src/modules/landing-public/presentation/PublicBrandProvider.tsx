import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { applyBranding } from "@shared/lib/apply-branding";
import { resolvePublicBrand } from "@landing-public/infrastructure/public-brand.resolver";
import { injectPwaTags } from "@landing-public/pwa/injectPwaTags";
import { purgePublicSw } from "@landing-public/pwa/purgePublicSw";
import { hexToHsl } from "@landing-public/utils/hex-to-hsl";
import type { PublicBrand, PublicBrandState } from "@landing-public/domain/public-brand.types";
import "@landing-public/styles/landing.css";

export const PublicBrandContext = createContext<PublicBrandState>({ status: "loading" });

function apply(b: PublicBrand): void {
  const root = document.documentElement;
  root.style.setProperty("--tenant-primary-hsl", hexToHsl(b.primaryColor));
  root.style.setProperty("--tenant-accent-hsl", hexToHsl(b.accentColor));
  if (b.themeVariant === "light" || b.themeVariant === "dark") root.setAttribute("data-theme", b.themeVariant);
  else root.removeAttribute("data-theme"); // auto → media query prefers-color-scheme
  applyBranding({
    tenantId: b.tenantId, displayName: b.displayName, legalName: b.displayName,
    theme: { primaryColor: b.primaryColor, secondaryColor: null, accentColor: b.accentColor, sidebarBg: null,
      sidebarText: null, sidebarHover: null, dangerColor: null, successColor: null, warningColor: null, defaultMode: null },
    faviconUrl: b.faviconUrl ?? b.logoUrl, // sin favicon dedicado → usa el logo del tenant (nunca el de NÚCLEO)
  });
}

// Resuelve el tenant por window.location.hostname (client-side, SSR-safe: init loading). Sin auth.
export function PublicBrandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicBrandState>({ status: "loading" });
  useEffect(() => {
    if (typeof window === "undefined") return;
    // .catch: si la resolución del brand rechaza (red mobile, RPC caído), NO dejar el estado en "loading"
    // para siempre (colgaba el portal en el spinner "…" + flash dorado NÚCLEO). Cae a fallback.
    void resolvePublicBrand(window.location.hostname).then((b) => {
      if (b) { apply(b); injectPwaTags(b); purgePublicSw(); setState({ status: "ready", brand: b }); } else setState({ status: "fallback" });
    }).catch(() => setState({ status: "fallback" }));
  }, []);
  return <PublicBrandContext.Provider value={state}>{children}</PublicBrandContext.Provider>;
}
