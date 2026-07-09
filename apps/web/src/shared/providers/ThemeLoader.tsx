import { useEffect } from "react";
import { useBrand } from "@shared/providers/brand-context";
import { applyBranding } from "@shared/lib/apply-branding";

// Aplica el tema al :root cada vez que cambia el brand context (skip null vía themeVars).
// Separado de BrandProvider (data) para que el efecto viva en un solo lugar y sin ciclo de imports.
export function ThemeLoader() {
  const brand = useBrand();
  useEffect(() => {
    if (brand.isLoading || !brand.tenantId) return;
    applyBranding({ tenantId: brand.tenantId, displayName: brand.displayName, legalName: brand.legalName, theme: brand.theme, faviconUrl: brand.faviconUrl });
  }, [brand]);
  return null;
}

// Hook fino para consumir solo el tema.
export function useTheme() {
  return useBrand().theme;
}
