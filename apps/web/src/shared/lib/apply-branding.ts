import { themeVars, type TenantTheme } from "@shared/lib/theme-vars";

// Aplica el tema del tenant al :root (solo valores no-null), favicon, título, y cachea para anti-flash.
export const THEME_CACHE_KEY = "nucleo:theme-cache:v1";

export function applyBranding(b: { tenantId: string; displayName: string; legalName: string; theme: TenantTheme }): void {
  if (typeof document === "undefined") return;
  const vars = themeVars(b.theme);
  const root = document.documentElement.style;
  for (const k in vars) root.setProperty(k, vars[k]!);
  document.title = b.displayName || b.legalName || "NÚCLEO by raisen";
  if (b.theme.primaryColor) applyFavicon(b.theme.primaryColor, b.displayName || b.legalName);
  try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ tenantId: b.tenantId, vars })); } catch { /* noop */ }
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
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.href = c.toDataURL("image/png");
}
