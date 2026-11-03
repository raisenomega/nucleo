// Href seguro para enlaces cuyo destino escribe un editor (bloques de campaña, CTAs).
// Allowlist de esquemas navegables/de contacto; relativos y anclas (#form, /x, ?q) resuelven
// contra la base https. El parser WHATWG normaliza tabs/saltos/control ("java\tscript:"),
// así que se evalúa el esquema real que usaría el navegador. Resto (javascript:, data:,
// vbscript:, file:, blob:…) → fallback.
const ALLOWED = new Set(["http:", "https:", "mailto:", "tel:", "sms:", "whatsapp:"]);
const BASE = "https://base.invalid";

export function safeHref(raw: string | null | undefined, fallback = "#"): string {
  const v = (raw ?? "").trim();
  if (!v) return fallback;
  try {
    return ALLOWED.has(new URL(v, BASE).protocol) ? v : fallback;
  } catch {
    return fallback;
  }
}
