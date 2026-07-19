// Tema del portal elegido por el cliente (light/dark/auto). Persiste en localStorage y aplica data-theme.
export type Theme = "light" | "dark" | "auto";
const KEY = "portal_theme";

export function applyTheme(th: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (th === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", th);
  try { localStorage.setItem(KEY, th); } catch { /* storage bloqueado */ }
}
export function getTheme(): Theme {
  try { return (localStorage.getItem(KEY) as Theme | null) ?? "auto"; } catch { return "auto"; }
}
// Aplica la preferencia guardada al montar (solo si el cliente la eligió; si no, respeta el tema del tenant).
export function applySavedTheme(): void {
  try { const s = localStorage.getItem(KEY); if (s) applyTheme(s as Theme); } catch { /* noop */ }
}
