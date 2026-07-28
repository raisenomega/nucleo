import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { track } from "@shared/analytics/track";
import { DemoTrigger } from "@shared/components/DemoTrigger";
import { getCampaignPage } from "@campaigns/infrastructure/campaigns-public.repository";
import { BlockRenderer } from "@campaigns/presentation/blocks/BlockRenderer";
import type { CampaignPageData } from "@campaigns/domain/campaign.types";
import "@campaigns/presentation/campaign.css";

// Luminancia relativa (0 negro … 1 blanco) de un hex, para elegir contraste. Sin literales de color (§9).
function lum(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1]!, 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, bl = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

// Render público de /c/{slug}. `initial` viene del loader SSR (publicadas). En preview, si el SSR anon no trajo
// el borrador, se re-pide en cliente con la sesión autenticada (el RPC solo lo entrega a quien gestiona la página).
export function CampaignPageView({ initial, preview, slug }: { initial: CampaignPageData | null; preview: boolean; slug: string }) {
  const [data, setData] = useState<CampaignPageData | null>(initial);
  // page_view al motor de 2.8 (path=/c/{slug}, tenant resuelto por host). Los previews de borrador no se trackean.
  useEffect(() => { if (!preview) track("page_view"); }, [preview]);
  useEffect(() => {
    if (!data && preview && typeof window !== "undefined") void getCampaignPage(window.location.host, slug, true).then(setData);
  }, [data, preview, slug]);
  if (!data) return <div className="camp-root camp-empty">{preview ? "Cargando vista previa…" : "No encontrada."}</div>;
  const b = data.brand;
  const prim = b?.primaryColor ?? ""; const acc = b?.accentColor ?? "";
  // Si el primary es casi negro/blanco, el accent manda como color interactivo (botones/checks) → contraste usable.
  const inter = prim && lum(prim) > 0.14 && lum(prim) < 0.85 ? prim : (acc || prim);
  const vars = (inter ? { "--camp-primary": inter, "--camp-accent": acc || inter } : {}) as CSSProperties;
  const variant = b?.themeVariant === "light" || b?.themeVariant === "dark" ? b.themeVariant : undefined;
  const oncontrast = inter ? (lum(inter) > 0.6 ? "dark" : "light") : undefined; // texto sobre el color interactivo
  return (
    <div className="camp-root" style={vars} data-theme={variant} data-oncontrast={oncontrast}>
      {preview && !data.page.isPublished && <div className="camp-preview-banner">MODO VISTA PREVIA — esta página no está publicada</div>}
      {data.blocks.map((blk) => <BlockRenderer key={blk.id} block={blk} lang={data.page.lang} pageId={data.page.id} />)}
      <DemoTrigger lang={data.page.lang === "en" ? "en" : "es"}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-bold text-black shadow-lg transition-transform hover:scale-105">
        🚀 {data.page.lang === "en" ? "Try demo" : "Probar demo"}
      </DemoTrigger>
    </div>
  );
}
