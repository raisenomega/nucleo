import { buildTenantManifest } from "@landing-public/pwa/buildTenantManifest";
import type { PublicBrand } from "@landing-public/domain/public-brand.types";

function upsertMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
  el.content = content;
}
function upsertLink(rel: string, href: string, sizes?: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
  if (el.href.startsWith("blob:")) URL.revokeObjectURL(el.href); // libera el blob anterior
  el.href = href; if (sizes) el.setAttribute("sizes", sizes);
}

// Inyecta manifest branded (Blob URL) + theme-color + apple-touch-icon + app-title del tenant. Idempotente.
export function injectPwaTags(b: PublicBrand): void {
  if (typeof document === "undefined") return;
  const json = JSON.stringify(buildTenantManifest(b));
  const url = URL.createObjectURL(new Blob([json], { type: "application/manifest+json" }));
  upsertLink("manifest", url);
  upsertMeta("theme-color", b.accentColor);
  upsertMeta("apple-mobile-web-app-title", b.displayName);
  upsertMeta("apple-mobile-web-app-capable", "yes");
  if (b.logoUrl) upsertLink("apple-touch-icon", b.logoUrl, "192x192");
}
