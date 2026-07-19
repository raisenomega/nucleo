import { themeVars, type TenantTheme } from "@shared/lib/theme-vars";

// Aplica el tema del tenant al :root (solo valores no-null), favicon, título, y cachea para anti-flash.
export const THEME_CACHE_KEY = "nucleo:theme-cache:v1";

// Modo efectivo: pref del usuario (localStorage 'theme') → default del tenant → sistema.
export function resolveMode(defaultMode: string | null): boolean {
  if (typeof window === "undefined") return true;
  const pref = localStorage.getItem("theme");
  if (pref === "dark" || pref === "light") return pref === "dark";
  if (defaultMode === "dark" || defaultMode === "light") return defaultMode === "dark";
  return !window.matchMedia || window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyBranding(b: { tenantId: string; displayName: string; legalName: string; theme: TenantTheme; faviconUrl?: string | null }): void {
  if (typeof document === "undefined") return;
  const vars = themeVars(b.theme);
  const root = document.documentElement.style;
  for (const k in vars) root.setProperty(k, vars[k]!);
  document.title = b.displayName || b.legalName || "Portal";
  if (b.faviconUrl) setFavicon(b.faviconUrl);
  else if (b.theme.primaryColor) applyFavicon(b.theme.primaryColor, b.displayName || b.legalName);
  if (!localStorage.getItem("theme")) document.documentElement.classList.toggle("dark", resolveMode(b.theme.defaultMode));
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ tenantId: b.tenantId, vars, defaultMode: b.theme.defaultMode }));
  } catch { /* noop */ }
}

function applyFavicon(color: string, name: string): void {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 32;
  const g = c.getContext("2d");
  if (!g) return;
  g.fillStyle = color;
  g.beginPath(); g.arc(16, 16, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff";
  g.font = "bold 20px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText((name.trim()[0] || "N").toUpperCase(), 16, 17);
  setFavicon(c.toDataURL("image/png"));
}

// Repunta los <link rel=icon> estáticos (SVG/ICO de NÚCLEO) al favicon del tenant en vez de solo quitarles
// rel: si se quitaba el rel, el browser caía al /favicon.ico por convención (= ícono NÚCLEO). Sin removeChild
// (no rompe hidratación). Además mantiene UN link dedicado (data-dynamic-icon) appendeado al final.
function setFavicon(href: string): void {
  document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']:not([data-dynamic-icon])").forEach((l) => {
    l.removeAttribute("type"); l.removeAttribute("sizes"); l.href = href;
  });
  let link = document.querySelector<HTMLLinkElement>("link[data-dynamic-icon]");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-dynamic-icon", "");
    document.head.appendChild(link);
  }
  link.href = href;
}
