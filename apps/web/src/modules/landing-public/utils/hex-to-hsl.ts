// hex (#rrggbb) → "H S% L%" (formato HSL crudo para CSS var). Puro, sin DOM. Fallback si no es hex.
export function hexToHsl(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "0 0% 50%";
  const int = parseInt(m[1]!, 16);
  const r = ((int >> 16) & 255) / 255, g = ((int >> 8) & 255) / 255, b = (int & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
