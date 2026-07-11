// Fila completa de tenant_landing_products devuelta por _public_get_landing_product (to_jsonb, snake_case).
export interface ProductFull {
  id: string; slug: string; name: string; short_description: string | null; long_description: string | null;
  price: number; compare_at_price: number | null; currency: string;
  primary_image_url: string | null; gallery_images: string[] | null;
  meta_title: string | null; meta_description: string | null; category_id: string | null;
}
