// El tema usa tokens HSL en componentes: `--primary: 38 85% 55%` consumido como `hsl(var(--primary))`.
// settings guarda hex → hay que convertir a "H S% L%" para setear --primary en runtime (white-label).

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexToHsl(hex: string): string | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Texto legible sobre el color: oscuro si el fondo es claro, blanco si es oscuro (WCAG aproximado).
export function foregroundFor(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "0 0% 100%";
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return lum > 0.6 ? "225 20% 8%" : "0 0% 100%";
}
