import { supabase } from "@shared/lib/supabase";
import type { CampaignPageData, CampaignBlock } from "@campaigns/domain/campaign.types";

type J = Record<string, unknown>;

const mapBlock = (b: J): CampaignBlock => ({
  id: b.id as string, blockType: b.block_type as CampaignBlock["blockType"], displayOrder: Number(b.display_order ?? 0),
  contentEs: (b.content_es as J) ?? {}, contentEn: (b.content_en as J) ?? null, config: (b.config as J) ?? {},
  isVisible: b.is_visible !== false,
});

// Mapea el jsonb de _public_get_campaign_page / get_campaign_page_admin (mismo shape de page+blocks).
export function mapPage(d: J): CampaignPageData {
  const p = (d.page ?? {}) as J; const br = d.brand as J | null | undefined;
  return {
    page: {
      id: p.id as string, name: p.name as string, slug: p.slug as string, isPublished: p.is_published === true,
      seoTitle: (p.seo_title as string) ?? null, seoDescription: (p.seo_description as string) ?? null,
      ogImageUrl: (p.og_image_url as string) ?? null, lang: (p.lang as CampaignPageData["page"]["lang"]) ?? "es",
    },
    blocks: (Array.isArray(d.blocks) ? (d.blocks as J[]) : []).map(mapBlock),
    brand: br ? {
      primaryColor: (br.primary_color as string) ?? null, accentColor: (br.accent_color as string) ?? null,
      logoUrl: (br.logo_url as string) ?? null, displayName: (br.display_name as string) ?? null,
      themeVariant: (br.theme_variant as string) ?? null,
    } : null,
  };
}

// SSR (anon) → solo publicadas. Client autenticado + preview → el RPC honra borradores si el actor gestiona la página.
export async function getCampaignPage(host: string, slug: string, preview: boolean): Promise<CampaignPageData | null> {
  const { data } = await supabase.rpc("_public_get_campaign_page", { _host: host, _slug: slug, _preview: preview });
  return data ? mapPage(data as J) : null;
}

// R2 · submit del bloque Formulario. Ramifica por host en el RPC (tenant→leads / plataforma→marketing_leads).
export async function createCampaignLead(host: string, payload: J): Promise<{ ok: boolean; code?: string }> {
  const { data } = await supabase.rpc("_campaign_create_lead", { _host: host, _payload: payload });
  const r = (data ?? {}) as J;
  return r.status === "ok" ? { ok: true } : { ok: false, code: (r.code as string) ?? "error" };
}
