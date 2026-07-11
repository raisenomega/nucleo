// BC @landing-public — visitante público de la landing. Separado de @landing (panel de edición del CEO).
export interface PublicBrand {
  tenantId: string; slug: string; displayName: string;
  landingEnabled: boolean; stripeEnabled: boolean; defaultLanguage: string;
  themeVariant: "light" | "dark" | "auto";
  primaryColor: string; accentColor: string; logoUrl: string | null; faviconUrl: string | null;
  contactPhone: string | null; contactEmail: string | null;
  socialLinks: { facebook: string | null; instagram: string | null; youtube: string | null; tiktok: string | null };
}

// loading -> resolviendo; ready -> tenant válido con landing_enabled; fallback -> hostname no matchea o landing off.
export type PublicBrandState =
  | { status: "loading" }
  | { status: "ready"; brand: PublicBrand }
  | { status: "fallback" };
