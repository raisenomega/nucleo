import type { ItemHighlight } from "@shared/types/item-highlight.types";

// Fila completa de tenant_landing_services devuelta por _public_get_landing_service (to_jsonb, snake_case).
export interface ServiceDetail {
  id: string; slug: string; name: string; short_description: string | null; long_description: string | null;
  pricing_type: string; price: number | null; price_unit: string | null;
  duration_estimate_minutes: number | null; requires_scheduling: boolean;
  primary_image_url: string | null; gallery_images: string[] | null; highlights: ItemHighlight[] | null;
  meta_title: string | null; meta_description: string | null;
}
