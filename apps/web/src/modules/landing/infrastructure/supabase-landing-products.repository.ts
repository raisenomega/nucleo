import { supabase } from "@shared/lib/supabase";
import type { ILandingProductsRepository, ProductWithCategory, Result } from "@landing/domain/landing.types";
import { toLandingProduct, fromLandingProductInput, type ProductRow } from "@landing/infrastructure/landing-product.mapper";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,category_id,slug,sku,name,short_description,long_description,price,compare_at_price,currency,tax_rate,stripe_price_id,track_inventory,stock_quantity,low_stock_threshold,primary_image_url,gallery_images,video_url,is_active,is_featured,display_order,attributes,meta_title,meta_description,is_published,form_id,tenant_landing_categories(name)";

export const supabaseLandingProductsRepository: ILandingProductsRepository = {
  async list(): Promise<ProductWithCategory[]> {
    const { data } = await supabase.from("tenant_landing_products").select(SEL).order("display_order");
    return ((data as ProductRow[] | null) ?? []).map(toLandingProduct);
  },
  async get(id): Promise<ProductWithCategory | null> {
    const { data } = await supabase.from("tenant_landing_products").select(SEL).eq("id", id).maybeSingle();
    return data ? toLandingProduct(data as ProductRow) : null;
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_products").insert({ tenant_id: tenantId, ...fromLandingProductInput(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_products").update(fromLandingProductInput(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_products").delete().eq("id", id)).error);
  },
};
