import type { Result } from "@landing/domain/landing.types";

export interface LandingFaq {
  id: string; category: string; question: string; answer: string;
  language: string; isActive: boolean; displayOrder: number;
}
export type FaqInput = Omit<LandingFaq, "id">;
export interface ILandingFaqsRepository {
  list(): Promise<LandingFaq[]>;
  create(tenantId: string, input: FaqInput): Promise<Result>;
  update(id: string, input: FaqInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
