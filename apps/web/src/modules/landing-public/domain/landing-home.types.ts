// Shape del payload de _public_get_landing_home (bloques del home data-driven, snake_case del RPC).
export interface HomeCategory { id: string; slug: string; name: string; icon_name: string | null; image_url: string | null; }
export interface HomeProduct { id: string; slug: string; name: string; short_description: string | null; price: number; compare_at_price: number | null; currency: string; primary_image_url: string | null; }
export interface HomeService { id: string; slug: string; name: string; short_description: string | null; pricing_type: string; price: number | null; price_unit: string | null; primary_image_url: string | null; }
export interface HomePackage { id: string; slug: string; name: string; short_description: string | null; price: number; compare_at_price: number | null; currency: string; primary_image_url: string | null; badge_label: string | null; }
export interface LandingHome {
  hero: Record<string, unknown> | null;
  categories: HomeCategory[]; featured_products: HomeProduct[]; featured_services: HomeService[];
  featured_packages: HomePackage[]; testimonials: unknown[]; faqs_preview: unknown[];
}
