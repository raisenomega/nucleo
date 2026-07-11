import type { LandingTestimonial, TestimonialInput, Rating } from "@landing/domain/landing-testimonial.types";

export interface TestimonialRow {
  id: string; client_name: string; client_title: string | null; client_company: string | null;
  content: string; rating: number | null; client_avatar_url: string | null;
  language: string | null; source: string | null; source_url: string | null;
  is_active: boolean; is_featured: boolean; display_order: number;
}
export const toTestimonial = (r: TestimonialRow): LandingTestimonial => ({
  id: r.id, clientName: r.client_name, clientTitle: r.client_title ?? "", clientCompany: r.client_company ?? "",
  content: r.content, rating: (r.rating ?? 5) as Rating, avatarUrl: r.client_avatar_url,
  language: r.language ?? "es", source: r.source ?? "", sourceUrl: r.source_url ?? "",
  isActive: r.is_active, isFeatured: r.is_featured, displayOrder: r.display_order,
});
export const fromTestimonial = (i: TestimonialInput) => ({
  client_name: i.clientName, client_title: i.clientTitle || null, client_company: i.clientCompany || null,
  content: i.content, rating: i.rating, client_avatar_url: i.avatarUrl,
  language: i.language, source: i.source || null, source_url: i.sourceUrl || null,
  is_active: i.isActive, is_featured: i.isFeatured, display_order: i.displayOrder,
});
