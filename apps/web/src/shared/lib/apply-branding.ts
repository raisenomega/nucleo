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
  document.title = b.displayName || b.legalName || "NÚCLEO by raisen";
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

// Usa UN link dedicado (data-dynamic-icon), appendeado al final para que el browser lo prefiera.
// Nunca hace remove() de los <link rel=icon> que gestiona React (HeadContent) → evita "removeChild of
// null" durante la hidratación (Fix 3, Fase 2). Idempotente: reusa el link en llamadas siguientes.
function setFavicon(href: string): void {
  let link = document.querySelector<HTMLLinkElement>("link[data-dynamic-icon]");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-dynamic-icon", "");
    document.head.appendChild(link);
  }
  link.href = href;
}
