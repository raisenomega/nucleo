import { supabase } from "@shared/lib/supabase";
import type { ILandingCategoriesRepository, LandingCategory, CategoryInput, Result } from "@landing/domain/landing.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,slug,name,description,icon_name,image_url,display_order,is_active,category_type";
interface Row {
  id: string; slug: string; name: string; description: string | null; icon_name: string | null; image_url: string | null;
  display_order: number; is_active: boolean; category_type: LandingCategory["categoryType"];
}
const toCat = (r: Row): LandingCategory => ({
  id: r.id, slug: r.slug, name: r.name, description: r.description ?? "", iconName: r.icon_name, imageUrl: r.image_url,
  displayOrder: r.display_order, isActive: r.is_active, categoryType: r.category_type,
});
const fromCat = (c: CategoryInput) => ({
  slug: c.slug, name: c.name, description: c.description || null, icon_name: c.iconName, image_url: c.imageUrl,
  display_order: c.displayOrder, is_active: c.isActive, category_type: c.categoryType,
});

export const supabaseLandingCategoriesRepository: ILandingCategoriesRepository = {
  async list(): Promise<LandingCategory[]> {
    const { data } = await supabase.from("tenant_landing_categories").select(SEL).order("display_order");
    return ((data as Row[] | null) ?? []).map(toCat);
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_categories").insert({ tenant_id: tenantId, ...fromCat(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_categories").update(fromCat(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_categories").delete().eq("id", id)).error);
  },
};
