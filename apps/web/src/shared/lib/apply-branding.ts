import { hexToHsl, foregroundFor } from "@shared/lib/color";

// Efectos DOM del branding (solo cliente): colores → CSS vars del :root, favicon canvas, título del tab.
// Sin color configurado → no toca nada (quedan los defaults dorado NÚCLEO).
export interface BrandLike {
  displayName: string; legalName: string; primaryColor: string; accentColor: string;
}

export function applyBranding(b: BrandLike): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  if (b.primaryColor) {
    const hsl = hexToHsl(b.primaryColor);
    if (hsl) {
      root.setProperty("--primary", hsl);
      root.setProperty("--primary-hover", hsl);
      root.setProperty("--sidebar-primary", hsl);
      root.setProperty("--primary-foreground", foregroundFor(b.primaryColor));
      applyFavicon(b.primaryColor, b.displayName || b.legalName);
    }
  }
  if (b.accentColor) {
    const a = hexToHsl(b.accentColor);
    if (a) root.setProperty("--accent", a);
  }
  document.title = b.displayName || b.legalName || "NÚCLEO by raisen";
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
