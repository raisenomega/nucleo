import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { track } from "@shared/analytics/track";
import { getCampaignPage } from "@campaigns/infrastructure/campaigns-public.repository";
import { BlockRenderer } from "@campaigns/presentation/blocks/BlockRenderer";
import type { CampaignPageData } from "@campaigns/domain/campaign.types";
import "@campaigns/presentation/campaign.css";

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
  const vars = (b?.primaryColor ? { "--camp-primary": b.primaryColor, "--camp-accent": b.accentColor ?? b.primaryColor } : {}) as CSSProperties;
  const variant = b?.themeVariant === "light" || b?.themeVariant === "dark" ? b.themeVariant : undefined;
  return (
    <div className="camp-root" style={vars} data-theme={variant}>
      {preview && !data.page.isPublished && <div className="camp-preview-banner">MODO VISTA PREVIA — esta página no está publicada</div>}
      {data.blocks.map((blk) => <BlockRenderer key={blk.id} block={blk} lang={data.page.lang} pageId={data.page.id} />)}
    </div>
  );
}
