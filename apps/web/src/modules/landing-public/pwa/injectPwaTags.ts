import type { PublicBrand } from "@landing-public/domain/public-brand.types";

function upsertMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
  el.content = content;
}
function upsertLink(rel: string, href: string, sizes?: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
  el.href = href; if (sizes) el.setAttribute("sizes", sizes);
}

// Apunta el manifest al endpoint dinámico (Nitro handler → URL HTTP real, requisito de instalabilidad Chrome) y
// setea theme-color/apple-touch-icon/app-title del tenant (dependen del brand resuelto en runtime). Idempotente.
export function injectPwaTags(b: PublicBrand): void {
  if (typeof document === "undefined") return;
  upsertLink("manifest", "/api/manifest.webmanifest");
  upsertMeta("theme-color", b.accentColor);
  upsertMeta("apple-mobile-web-app-title", b.displayName);
  upsertMeta("apple-mobile-web-app-capable", "yes");
  upsertMeta("mobile-web-app-capable", "yes"); // reemplazo no-deprecado del apple-* legacy (se dejan ambos por compat)
  if (b.logoUrl) upsertLink("apple-touch-icon", b.logoUrl, "192x192");
}
