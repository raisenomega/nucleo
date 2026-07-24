// R2 · captura la atribución COMPLETA del query-string para el lead de campaña. Distinto del tracker de 2.8a
// (que solo manda utm_source/medium/campaign al motor de analytics): acá el lead necesita los 7 params + fbclid/
// gclid + referrer para medir ROI de anuncios. Se persiste en sessionStorage (sobrevive si el visitante navega
// antes de convertir) — first-touch, igual que los UTMs de 2.8a.
const KEY = "_nr_camp_attr";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];

export type Attribution = Record<string, string>;

export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const cached = sessionStorage.getItem(KEY);
    if (cached) return JSON.parse(cached) as Attribution;
    const q = new URLSearchParams(window.location.search);
    const a: Attribution = {};
    for (const p of PARAMS) { const v = q.get(p); if (v) a[p] = v; }
    if (document.referrer) a.referrer = document.referrer;
    a.landing_path = window.location.pathname;
    sessionStorage.setItem(KEY, JSON.stringify(a));
    return a;
  } catch { return {}; }
}
