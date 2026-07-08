import { hexToHsl, foregroundFor } from "@shared/lib/color";

// Tema runtime del tenant. NULL = "hereda el default de plataforma" (no se aplica CSS var).
export interface TenantTheme {
  primaryColor: string | null; secondaryColor: string | null; accentColor: string | null;
  sidebarBg: string | null; sidebarText: string | null; sidebarHover: string | null;
  dangerColor: string | null; successColor: string | null; warningColor: string | null;
  defaultMode: string | null;
}
export const EMPTY_THEME: TenantTheme = {
  primaryColor: null, secondaryColor: null, accentColor: null, sidebarBg: null, sidebarText: null,
  sidebarHover: null, dangerColor: null, successColor: null, warningColor: null, defaultMode: null,
};

// Cada color → sus tokens CSS (HSL en componentes, consumidos como hsl(var(--x))).
// success/warning NO tienen token (la app usa clases green/amber): se guardan pero no se aplican hoy.
const MAP: [keyof TenantTheme, string[]][] = [
  ["primaryColor", ["--primary", "--primary-hover", "--sidebar-primary", "--ring", "--sidebar-ring"]],
  ["secondaryColor", ["--secondary"]],
  ["accentColor", ["--accent"]],
  ["sidebarBg", ["--sidebar-background"]],
  ["sidebarText", ["--sidebar-foreground"]],
  ["sidebarHover", ["--sidebar-accent"]],
  ["dangerColor", ["--destructive"]],
];

// Devuelve { "--token": "H S% L%" } SOLO para colores no-null válidos (+ --primary-foreground por contraste).
export function themeVars(t: TenantTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, tokens] of MAP) {
    const hex = t[key];
    if (hex == null) continue;
    const hsl = hexToHsl(hex);
    if (!hsl) continue;
    for (const tok of tokens) vars[tok] = hsl;
  }
  if (t.primaryColor) vars["--primary-foreground"] = foregroundFor(t.primaryColor);
  return vars;
}
