import { supabase } from "@shared/lib/supabase";
import type { ILandingServicesRepository, ServiceWithCategory, Result } from "@landing/domain/landing.types";
import { toLandingService, fromLandingServiceInput, type ServiceRow } from "@landing/infrastructure/landing-service.mapper";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,category_id,slug,name,short_description,long_description,pricing_type,price,price_unit,duration_estimate_minutes,requires_scheduling,primary_image_url,gallery_images,highlights,is_active,is_featured,display_order,meta_title,meta_description,is_published,tenant_landing_categories(name)";

export const supabaseLandingServicesRepository: ILandingServicesRepository = {
  async list(): Promise<ServiceWithCategory[]> {
    const { data } = await supabase.from("tenant_landing_services").select(SEL).order("display_order");
    return ((data as ServiceRow[] | null) ?? []).map(toLandingService);
  },
  async get(id): Promise<ServiceWithCategory | null> {
    const { data } = await supabase.from("tenant_landing_services").select(SEL).eq("id", id).maybeSingle();
    return data ? toLandingService(data as ServiceRow) : null;
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_services").insert({ tenant_id: tenantId, ...fromLandingServiceInput(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_services").update(fromLandingServiceInput(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_services").delete().eq("id", id)).error);
  },
};
