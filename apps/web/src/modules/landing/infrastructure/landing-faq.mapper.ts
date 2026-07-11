import type { LandingFaq, FaqInput } from "@landing/domain/landing-faq.types";

export interface FaqRow { id: string; category: string | null; question: string; answer: string; language: string | null; is_active: boolean; display_order: number; }
export const toFaq = (r: FaqRow): LandingFaq => ({
  id: r.id, category: r.category ?? "", question: r.question, answer: r.answer,
  language: r.language ?? "es", isActive: r.is_active, displayOrder: r.display_order,
});
export const fromFaq = (i: FaqInput) => ({
  category: i.category || null, question: i.question, answer: i.answer,
  language: i.language, is_active: i.isActive, display_order: i.displayOrder,
});
