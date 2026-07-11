import { useState } from "react";
import type { LandingTestimonial, TestimonialInput } from "@landing/domain/landing-testimonial.types";

export type SetT = <K extends keyof TestimonialInput>(k: K, v: TestimonialInput[K]) => void;
export type TSectionProps = { form: TestimonialInput; set: SetT };
const DEF: TestimonialInput = { clientName: "", clientTitle: "", clientCompany: "", content: "", rating: 5, avatarUrl: null, language: "es", source: "", sourceUrl: "", isActive: true, isFeatured: false, displayOrder: 0 };
const toInit = (t: LandingTestimonial): TestimonialInput => { const { id: _id, ...rest } = t; void _id; return rest; };

export function useTestimonialForm(initial?: LandingTestimonial) {
  const [form, setForm] = useState<TestimonialInput>(initial ? toInit(initial) : DEF);
  const set: SetT = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.clientName.trim().length >= 2 && form.content.trim().length >= 10;
  return { form, set, canSave };
}
