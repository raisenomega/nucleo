import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Oferta pública (to_jsonb de tenant_landing_offers, snake_case) que devuelve _public_get_active_offer.
export interface PublicOffer {
  id: string; badge_text_es: string; badge_text_en: string; hook_price: number;
  applicable_services: string[]; commitment_cycles: number;
  disclosure_es: string; disclosure_en: string; cta_label_es: string; cta_label_en: string;
  terms_es: string; terms_en: string;
  ask_service_type: boolean; modal_question_es: string; modal_question_en: string;
}

// Lee la primera oferta activa y vigente del tenant (definer RPC). null si no hay.
export function useActiveOffer(): PublicOffer | null {
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    void supabase.rpc("_public_get_active_offer", { _hostname: window.location.hostname })
      .then(({ data }) => setOffer((data as PublicOffer | null) ?? null));
  }, []);
  return offer;
}
