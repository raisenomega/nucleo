// Item normalizado de _public_get_landing_catalog (kind discrimina product/service/package).
export interface CatalogItem {
  id: string; slug: string; name: string; short_description: string | null;
  price: number | null; compare_at_price: number | null; currency: string;
  primary_image_url: string | null; is_featured: boolean;
  kind: "product" | "service" | "package"; category_id: string | null;
}

// Página del catálogo (respuesta paginada de _public_get_landing_catalog).
export interface CatalogPage { items: CatalogItem[]; total: number; page: number; page_size: number; }
