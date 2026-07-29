import { supabase } from "@shared/lib/supabase";

// Página pública dedicada de FAQs (anon, por hostname). Devuelve marca del tenant + TODAS las FAQs activas.
export interface PublicFaqsResp {
  status: string;
  tenant?: { display_name: string | null; logo_url: string | null; primary_color: string | null };
  faqs?: { question: string; answer: string; category: string | null }[];
}

export async function getPublicFaqs(): Promise<PublicFaqsResp> {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const { data } = await supabase.rpc("_public_get_faqs", { _hostname: hostname });
  return (data as PublicFaqsResp | null) ?? { status: "error" };
}
