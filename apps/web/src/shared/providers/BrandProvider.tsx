import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";
import { ThemeLoader } from "@shared/providers/ThemeLoader";
import { BrandContext, EMPTY_BRAND, type Brand } from "@shared/providers/brand-context";
import type { TenantTheme } from "@shared/lib/theme-vars";

interface ThemeRow {
  primary_color: string | null; secondary_color: string | null; accent_color: string | null;
  sidebar_bg: string | null; sidebar_text: string | null; sidebar_hover: string | null;
  danger_color: string | null; success_color: string | null; warning_color: string | null; default_mode: string | null;
}
const toTheme = (r: ThemeRow | undefined): TenantTheme => ({
  primaryColor: r?.primary_color ?? null, secondaryColor: r?.secondary_color ?? null, accentColor: r?.accent_color ?? null,
  sidebarBg: r?.sidebar_bg ?? null, sidebarText: r?.sidebar_text ?? null, sidebarHover: r?.sidebar_hover ?? null,
  dangerColor: r?.danger_color ?? null, successColor: r?.success_color ?? null, warningColor: r?.warning_color ?? null,
  defaultMode: r?.default_mode ?? null,
});

// Lee marca del tenant UNA vez (tras haber sesión). ThemeLoader aplica las CSS vars. Fuente única = tenant_themes + tenants.
export function BrandProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const tenantId = session?.tenantId ?? null;
  const [brand, setBrand] = useState<Brand>(EMPTY_BRAND);
  useEffect(() => {
    if (!tenantId) { setBrand({ ...EMPTY_BRAND, isLoading: false }); return; }
    let alive = true;
    void (async () => {
      const [ten, theme, files] = await Promise.all([
        supabase.from("tenants").select("legal_name,display_name").limit(1),
        supabase.from("tenant_themes").select("*").limit(1),
        supabase.storage.from("brand").list(tenantId),
      ]);
      if (!alive) return;
      const row = (ten.data as { legal_name: string; display_name: string | null }[] | null)?.[0];
      const hasLogo = ((files.data as { name: string }[] | null) ?? []).some((f) => f.name === "logo.png");
      const logoUrl = hasLogo ? supabase.storage.from("brand").getPublicUrl(`${tenantId}/logo.png`).data.publicUrl : null;
      setBrand({
        tenantId, displayName: row?.display_name ?? "", legalName: row?.legal_name ?? "",
        logoUrl, theme: toTheme((theme.data as ThemeRow[] | null)?.[0]), isLoading: false,
      });
    })();
    return () => { alive = false; };
  }, [tenantId]);
  return <BrandContext.Provider value={brand}><ThemeLoader />{children}</BrandContext.Provider>;
}

export { useBrand } from "@shared/providers/brand-context";
