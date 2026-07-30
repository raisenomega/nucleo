// Shape del payload de _public_get_landing_home (bloques del home data-driven, snake_case del RPC).
export interface HomeCategory { id: string; slug: string; name: string; icon_name: string | null; image_url: string | null; }
// cta_label / is_recurring son opcionales: solo el home los provee (RPC _public_get_landing_home). Catalog/Related
// reusan estas cards sin esos campos → undefined preserva el CTA por defecto y no muestra badge (sin regresión).
export interface HomeProduct { id: string; slug: string; name: string; short_description: string | null; price: number; compare_at_price: number | null; currency: string; primary_image_url: string | null; cta_label?: string | null; is_recurring?: boolean; }
export interface HomeService { id: string; slug: string; name: string; short_description: string | null; pricing_type: string; price: number | null; price_unit: string | null; primary_image_url: string | null; cta_label?: string | null; is_recurring?: boolean; }
export interface HomePackage { id: string; slug: string; name: string; short_description: string | null; price: number; compare_at_price: number | null; currency: string; primary_image_url: string | null; badge_label: string | null; cta_label?: string | null; is_recurring?: boolean; }
export interface HomeTestimonial { client_name: string; client_title: string | null; client_avatar_url: string | null; content: string; rating: number | null; }
export interface HomeFaq { question: string; answer: string; category: string | null; }
export interface LandingHome {
  hero: Record<string, unknown> | null;
  categories: HomeCategory[]; featured_products: HomeProduct[]; featured_services: HomeService[];
  featured_packages: HomePackage[]; testimonials: HomeTestimonial[]; faqs_preview: HomeFaq[];
}
