import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Lee/escribe tenant_landing_services.landing_hero.image_url del servicio con este slug (posición 1: hero secundario del
// home). Vive en tabla distinta a tenant_service_pages, por eso guarda inmediato (fuera del "Guardar" de la página).
export function useLandingHeroImage(slug: string) {
  const [ready, setReady] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    void supabase.from("tenant_landing_services").select("landing_hero").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (!on) return;
      setReady(Boolean(data));
      const h = (data?.landing_hero ?? null) as { image_url?: string } | null;
      setImageUrl(h?.image_url ?? null);
    });
    return () => { on = false; };
  }, [slug]);
  async function save(url: string | null): Promise<boolean> {
    const { data } = await supabase.from("tenant_landing_services").select("landing_hero").eq("slug", slug).maybeSingle();
    if (!data) return false;
    const hero = { ...((data.landing_hero as Record<string, unknown>) ?? {}), image_url: url };
    const { error } = await supabase.from("tenant_landing_services").update({ landing_hero: hero }).eq("slug", slug);
    if (!error) setImageUrl(url);
    return !error;
  }
  return { ready, imageUrl, save };
}
