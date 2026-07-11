import type { Result } from "@landing/domain/landing.types";

export type Rating = 1 | 2 | 3 | 4 | 5;
export interface LandingTestimonial {
  id: string; clientName: string; clientTitle: string; clientCompany: string;
  content: string; rating: Rating; avatarUrl: string | null;
  language: string; source: string; sourceUrl: string;
  isActive: boolean; isFeatured: boolean; displayOrder: number;
}
export type TestimonialInput = Omit<LandingTestimonial, "id">;
export interface ILandingTestimonialsRepository {
  list(): Promise<LandingTestimonial[]>;
  create(tenantId: string, input: TestimonialInput): Promise<Result>;
  update(id: string, input: TestimonialInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
