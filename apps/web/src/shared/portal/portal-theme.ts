// Tema del portal (claro/oscuro/auto) elegido por el cliente. Controla la CLASE .dark del <html>
// (patrón Tailwind/shadcn, igual que el resto del app) — NO el atributo data-theme, que solo movía
// tokens glass de la landing y dejaba el toggle sin efecto sobre --background/--secondary/--border.
export type Theme = "light" | "dark" | "auto";
const KEY = "portal_theme";

function systemDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
export function isDark(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}
export function applyTheme(th: Theme): void {
  if (typeof document === "undefined") return;
  const dark = th === "dark" || (th === "auto" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  try { localStorage.setItem(KEY, th); } catch { /* storage bloqueado */ }
}
export function getTheme(): Theme {
  try { return (localStorage.getItem(KEY) as Theme | null) ?? "auto"; } catch { return "auto"; }
}
// Al montar: si el cliente eligió light/dark lo aplica; si 'auto', respeta el tema del tenant ya aplicado.
export function applySavedTheme(): void {
  const s = getTheme();
  if (s === "light" || s === "dark") applyTheme(s);
}
// Alterna claro↔oscuro (botón Sol/Luna del header) y persiste la preferencia explícita.
export function toggleTheme(): Theme {
  const next: Theme = isDark() ? "light" : "dark";
  applyTheme(next);
  return next;
}
