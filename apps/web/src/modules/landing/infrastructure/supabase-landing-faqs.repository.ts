import { supabase } from "@shared/lib/supabase";
import type { Result } from "@landing/domain/landing.types";
import type { ILandingFaqsRepository, LandingFaq } from "@landing/domain/landing-faq.types";
import { toFaq, fromFaq, type FaqRow } from "@landing/infrastructure/landing-faq.mapper";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,category,question,answer,language,is_active,display_order";

export const supabaseLandingFaqsRepository: ILandingFaqsRepository = {
  async list(): Promise<LandingFaq[]> {
    const { data } = await supabase.from("tenant_landing_faqs").select(SEL).order("display_order");
    return ((data as FaqRow[] | null) ?? []).map(toFaq);
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_faqs").insert({ tenant_id: tenantId, ...fromFaq(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_faqs").update(fromFaq(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_faqs").delete().eq("id", id)).error);
  },
};
