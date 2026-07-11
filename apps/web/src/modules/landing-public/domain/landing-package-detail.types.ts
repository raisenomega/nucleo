// Fila completa de tenant_landing_packages + includeds expandidos server-side por _public_get_landing_package.
export interface IncludedItem { name: string; slug: string; primary_image_url: string | null; quantity: number; }
export interface PackageDetail {
  id: string; slug: string; name: string; short_description: string | null; long_description: string | null;
  price: number; compare_at_price: number | null; currency: string; badge_label: string | null;
  features_list: string[] | null; primary_image_url: string | null;
  included_products_expanded: IncludedItem[]; included_services_expanded: IncludedItem[];
  meta_title: string | null; meta_description: string | null;
}
