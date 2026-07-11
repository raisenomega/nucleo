import { supabase } from "@shared/lib/supabase";
import type { Result } from "@landing/domain/landing.types";
import type { ILandingPackagesRepository, LandingPackage } from "@landing/domain/landing-package.types";
import { toLandingPackage, fromLandingPackageInput, type PackageRow } from "@landing/infrastructure/landing-package.mapper";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,slug,name,short_description,long_description,price,compare_at_price,currency,included_products,included_services,features_list,primary_image_url,is_active,is_featured,display_order,badge_label,meta_title,meta_description,is_published";

export const supabaseLandingPackagesRepository: ILandingPackagesRepository = {
  async list(): Promise<LandingPackage[]> {
    const { data } = await supabase.from("tenant_landing_packages").select(SEL).order("display_order");
    return ((data as PackageRow[] | null) ?? []).map(toLandingPackage);
  },
  async get(id): Promise<LandingPackage | null> {
    const { data } = await supabase.from("tenant_landing_packages").select(SEL).eq("id", id).maybeSingle();
    return data ? toLandingPackage(data as PackageRow) : null;
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_packages").insert({ tenant_id: tenantId, ...fromLandingPackageInput(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_packages").update(fromLandingPackageInput(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_packages").delete().eq("id", id)).error);
  },
};
