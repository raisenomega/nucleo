import type { PublicBrand } from "@landing-public/domain/public-brand.types";

const ICON = (src: string, sizes: string) => ({ src, sizes, type: "image/png", purpose: "any maskable" });
const DEFAULT_ICONS = [ICON("/icons/icon-192.png", "192x192"), ICON("/icons/icon-512.png", "512x512")];

// Manifest PWA branded por tenant (se sirve client-side como Blob URL). logo_url del tenant o íconos default.
export function buildTenantManifest(b: PublicBrand): Record<string, unknown> {
  const icons = b.logoUrl ? [ICON(b.logoUrl, "192x192"), ICON(b.logoUrl, "512x512")] : DEFAULT_ICONS;
  return {
    name: b.displayName, short_name: b.displayName.slice(0, 12),
    description: `Sitio oficial de ${b.displayName}`,
    start_url: "/", scope: "/", display: "standalone", orientation: "portrait",
    theme_color: b.accentColor, background_color: b.primaryColor,
    icons, categories: ["business", "services"], lang: b.defaultLanguage || "es",
  };
}
