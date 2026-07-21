// Datos que alimentan el SEO (JSON-LD, llms.txt) leídos de la DB. Antes vivían hardcodeados en
// site.constants.ts y se desincronizaban cada vez que se tocaba un precio desde /web/precios.
//
// Se consulta por REST con la anon key (todo esto tiene RLS de lectura pública) y se cachea EN MEMORIA:
// sin cache, cada render SSR de la landing dispararía 3 requests a Supabase. En Vercel la memoria persiste
// por instancia caliente, así que el cache absorbe la mayoría de las visitas.
const TTL_MS = 5 * 60 * 1000;

export interface SeoTier { nameEs: string; nameEn: string; price: number; currency: string; period: string }
export interface SeoAddon { nameEs: string; nameEn: string; price: number; period: string }
export interface SeoFaq { qEs: string; qEn: string; aEs: string; aEn: string }
// faqVisible refleja marketing_sections: si el owner oculta la sección FAQ, el FAQPage deja de emitirse
// (declarar preguntas que no están en la página incumple las guías de datos estructurados).
export interface SeoData { tiers: SeoTier[]; addons: SeoAddon[]; faqs: SeoFaq[]; faqVisible: boolean }

let cache: { at: number; data: SeoData } | null = null;

// import.meta.env se inyecta en build (cliente y servidor); el env de Nitro se lee por globalThis para no
// depender de @types/node (este módulo también se compila para el bundle de cliente).
function env(k: string): string {
  const m = (import.meta as { env?: Record<string, string> }).env?.[k];
  if (m) return m;
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[k] ?? "";
}

async function rest<T>(path: string): Promise<T[]> {
  const url = env("VITE_SUPABASE_URL"), key = env("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) return [];
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  const d = await res.json() as T[];
  return Array.isArray(d) ? d : [];
}

type TierRaw = { name_es: string; name_en: string; price: string; currency: string; billing_period: string };
type AddonRaw = { name_es: string; name_en: string; price: string; billing_period: string };
type FaqRaw = { question_es: string; question_en: string; answer_es: string; answer_en: string };

// Devuelve null si la DB no responde: cada consumidor cae a su fallback estático en vez de emitir vacío.
export async function getSeoData(): Promise<SeoData | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const [t, a, f, sec] = await Promise.all([
      rest<TierRaw>("marketing_pricing_tiers?select=name_es,name_en,price,currency,billing_period&is_active=eq.true&order=display_order"),
      rest<AddonRaw>("marketing_pricing_addons?select=name_es,name_en,price,billing_period&is_active=eq.true&order=display_order"),
      rest<FaqRaw>("marketing_faqs?select=question_es,question_en,answer_es,answer_en&is_active=eq.true&order=display_order"),
      rest<{ is_visible: boolean }>("marketing_sections?select=is_visible&section_key=eq.faq"),
    ]);
    if (!t.length) return null; // sin planes no hay nada fiable que publicar
    const data: SeoData = {
      tiers: t.map((r) => ({ nameEs: r.name_es, nameEn: r.name_en, price: Number(r.price), currency: r.currency, period: r.billing_period })),
      addons: a.map((r) => ({ nameEs: r.name_es, nameEn: r.name_en, price: Number(r.price), period: r.billing_period })),
      faqs: f.map((r) => ({ qEs: r.question_es, qEn: r.question_en, aEs: r.answer_es, aEn: r.answer_en })),
      faqVisible: sec[0]?.is_visible !== false,
    };
    cache = { at: Date.now(), data };
    return data;
  } catch { return null; }
}
