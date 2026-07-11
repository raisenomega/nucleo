import { supabase } from "@shared/lib/supabase";
import type { ILandingConfigRepository, LandingConfig, Result } from "@landing/domain/landing.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "hero_title,hero_subtitle,hero_cta_label,hero_cta_type,hero_cta_href,hero_image_url,hero_video_url,meta_title,meta_description,meta_og_image_url,meta_keywords,public_phone,public_whatsapp,public_email,public_address,business_hours,social_facebook,social_instagram,social_youtube,social_tiktok,schema_business_type,schema_geo_lat,schema_geo_lng,schema_price_range";

interface Row { [k: string]: unknown }
const toConfig = (r: Row): LandingConfig => ({
  heroTitle: (r.hero_title as string) ?? "", heroSubtitle: (r.hero_subtitle as string) ?? "",
  heroCtaLabel: (r.hero_cta_label as string) ?? "", heroCtaType: (r.hero_cta_type as LandingConfig["heroCtaType"]) ?? "quote",
  heroCtaHref: (r.hero_cta_href as string) ?? "", heroImageUrl: (r.hero_image_url as string) ?? null, heroVideoUrl: (r.hero_video_url as string) ?? null,
  metaTitle: (r.meta_title as string) ?? "", metaDescription: (r.meta_description as string) ?? "",
  metaOgImageUrl: (r.meta_og_image_url as string) ?? null, metaKeywords: (r.meta_keywords as string[]) ?? [],
  publicPhone: (r.public_phone as string) ?? "", publicWhatsapp: (r.public_whatsapp as string) ?? "",
  publicEmail: (r.public_email as string) ?? "", publicAddress: (r.public_address as string) ?? "",
  businessHours: (r.business_hours as LandingConfig["businessHours"]) ?? null,
  socialFacebook: (r.social_facebook as string) ?? "", socialInstagram: (r.social_instagram as string) ?? "",
  socialYoutube: (r.social_youtube as string) ?? "", socialTiktok: (r.social_tiktok as string) ?? "",
  schemaBusinessType: (r.schema_business_type as string) ?? "LocalBusiness",
  schemaGeoLat: (r.schema_geo_lat as number) ?? null, schemaGeoLng: (r.schema_geo_lng as number) ?? null,
  schemaPriceRange: (r.schema_price_range as string) ?? "$$",
});
const fromConfig = (tenantId: string, c: LandingConfig) => ({
  tenant_id: tenantId, hero_title: c.heroTitle, hero_subtitle: c.heroSubtitle, hero_cta_label: c.heroCtaLabel,
  hero_cta_type: c.heroCtaType, hero_cta_href: c.heroCtaHref || null, hero_image_url: c.heroImageUrl, hero_video_url: c.heroVideoUrl,
  meta_title: c.metaTitle, meta_description: c.metaDescription, meta_og_image_url: c.metaOgImageUrl, meta_keywords: c.metaKeywords,
  public_phone: c.publicPhone || null, public_whatsapp: c.publicWhatsapp || null, public_email: c.publicEmail || null,
  public_address: c.publicAddress || null, business_hours: c.businessHours,
  social_facebook: c.socialFacebook || null, social_instagram: c.socialInstagram || null,
  social_youtube: c.socialYoutube || null, social_tiktok: c.socialTiktok || null,
  schema_business_type: c.schemaBusinessType, schema_geo_lat: c.schemaGeoLat, schema_geo_lng: c.schemaGeoLng, schema_price_range: c.schemaPriceRange,
});

export const supabaseLandingConfigRepository: ILandingConfigRepository = {
  async get(): Promise<LandingConfig | null> {
    const { data } = await supabase.from("tenant_landing_config").select(SEL).limit(1);
    const row = (data as Row[] | null)?.[0];
    return row ? toConfig(row) : null;
  },
  async upsert(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_config").upsert(fromConfig(tenantId, input))).error);
  },
};
