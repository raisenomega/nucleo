import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useSession } from "@shared/providers/SessionProvider";
import type { PromoOffer } from "@landing-public/domain/promo-offer.types";

// Lee/escribe tenant_landing_config.promo_offer (jsonb). El público lo recibe vía _public_get_landing_home.hero.
export function usePromoOffer() {
  const { session } = useSession();
  const [offer, setOffer] = useState<PromoOffer>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let on = true;
    void supabase.from("tenant_landing_config").select("promo_offer").limit(1).maybeSingle().then(({ data }) => {
      if (!on) return;
      setOffer((data?.promo_offer as PromoOffer | null) ?? {});
      setReady(true);
    });
    return () => { on = false; };
  }, []);
  async function save(o: PromoOffer): Promise<boolean> {
    if (!session?.tenantId) return false;
    const { error } = await supabase.from("tenant_landing_config").update({ promo_offer: o }).eq("tenant_id", session.tenantId);
    if (!error) setOffer(o);
    return !error;
  }
  return { offer, ready, save };
}
