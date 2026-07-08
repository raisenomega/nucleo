import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";
import { applyBranding } from "@shared/lib/apply-branding";

export interface Brand {
  displayName: string; legalName: string; logoUrl: string | null;
  primaryColor: string; accentColor: string; isLoading: boolean;
}
const EMPTY: Brand = { displayName: "", legalName: "", logoUrl: null, primaryColor: "", accentColor: "", isLoading: true };
const BrandContext = createContext<Brand>(EMPTY);

// Lee la marca del tenant UNA vez (tras haber sesión) y la aplica: colores, logo, favicon, título.
// Vive por encima del Outlet → no refetch al navegar. Sin datos → defaults NÚCLEO intactos.
export function BrandProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const tenantId = session?.tenantId ?? null;
  const [brand, setBrand] = useState<Brand>(EMPTY);
  useEffect(() => {
    if (!tenantId) { setBrand({ ...EMPTY, isLoading: false }); return; }
    let alive = true;
    void (async () => {
      const [ten, logo, cfg] = await Promise.all([
        supabase.from("tenants").select("legal_name,display_name").limit(1),
        supabase.storage.from("brand").createSignedUrl(`${tenantId}/logo.png`, 3600),
        supabase.from("settings").select("key,value").in("key", ["primary_color", "accent_color"]),
      ]);
      if (!alive) return;
      const row = (ten.data as { legal_name: string; display_name: string | null }[] | null)?.[0];
      const s = Object.fromEntries(((cfg.data as { key: string; value: string }[] | null) ?? []).map((r) => [r.key, r.value]));
      const b: Brand = {
        displayName: row?.display_name ?? "", legalName: row?.legal_name ?? "",
        logoUrl: logo.data?.signedUrl ?? null,
        primaryColor: s.primary_color ?? "", accentColor: s.accent_color ?? "", isLoading: false,
      };
      setBrand(b);
      applyBranding(b);
    })();
    return () => { alive = false; };
  }, [tenantId]);
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}
