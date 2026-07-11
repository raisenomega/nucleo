import { supabase } from "@shared/lib/supabase";
import type { PublicBrand } from "@landing-public/domain/public-brand.types";

// Resuelve el tenant público por hostname vía RPC read-only (migr 133). null si no matchea o landing off.
export async function resolvePublicBrand(hostname: string): Promise<PublicBrand | null> {
  const { data } = await supabase.rpc("_public_resolve_tenant_by_host", { _hostname: hostname });
  const d = data as Record<string, unknown> | null;
  if (!d || d.status === "error" || !d.tenant_id) return null;
  const s = (d.social_links ?? {}) as Record<string, string | null>;
  return {
    tenantId: d.tenant_id as string, slug: d.slug as string, displayName: d.display_name as string,
    landingEnabled: d.landing_enabled as boolean, stripeEnabled: d.stripe_enabled as boolean,
    defaultLanguage: (d.default_language as string) ?? "es",
    primaryColor: d.primary_color as string, accentColor: d.accent_color as string,
    logoUrl: (d.logo_url as string | null) ?? null, faviconUrl: (d.favicon_url as string | null) ?? null,
    contactPhone: (d.contact_phone as string | null) ?? null, contactEmail: (d.contact_email as string | null) ?? null,
    socialLinks: { facebook: s.facebook ?? null, instagram: s.instagram ?? null, youtube: s.youtube ?? null, tiktok: s.tiktok ?? null },
  };
}
