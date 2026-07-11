import { supabase } from "@shared/lib/supabase";
import type { Result } from "@landing/domain/landing.types";
import type { ILandingTestimonialsRepository, LandingTestimonial } from "@landing/domain/landing-testimonial.types";
import { toTestimonial, fromTestimonial, type TestimonialRow } from "@landing/infrastructure/landing-testimonial.mapper";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,client_name,client_title,client_company,content,rating,client_avatar_url,language,source,source_url,is_active,is_featured,display_order";

export const supabaseLandingTestimonialsRepository: ILandingTestimonialsRepository = {
  async list(): Promise<LandingTestimonial[]> {
    const { data } = await supabase.from("tenant_landing_testimonials").select(SEL).order("display_order");
    return ((data as TestimonialRow[] | null) ?? []).map(toTestimonial);
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_testimonials").insert({ tenant_id: tenantId, ...fromTestimonial(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_testimonials").update(fromTestimonial(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_testimonials").delete().eq("id", id)).error);
  },
};
