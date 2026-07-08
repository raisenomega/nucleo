import { createContext, useContext } from "react";
import { EMPTY_THEME, type TenantTheme } from "@shared/lib/theme-vars";

// Contexto de marca (separado del provider para evitar ciclo BrandProvider ↔ ThemeLoader).
export interface Brand {
  tenantId: string | null; displayName: string; legalName: string;
  logoUrl: string | null; theme: TenantTheme; isLoading: boolean;
}
export const EMPTY_BRAND: Brand = { tenantId: null, displayName: "", legalName: "", logoUrl: null, theme: EMPTY_THEME, isLoading: true };
export const BrandContext = createContext<Brand>(EMPTY_BRAND);

export function useBrand(): Brand {
  return useContext(BrandContext);
}
