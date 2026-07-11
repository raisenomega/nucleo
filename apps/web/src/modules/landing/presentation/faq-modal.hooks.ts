import { useState } from "react";
import type { LandingFaq, FaqInput } from "@landing/domain/landing-faq.types";

export type SetF = <K extends keyof FaqInput>(k: K, v: FaqInput[K]) => void;
export type FSectionProps = { form: FaqInput; set: SetF };
const DEF: FaqInput = { category: "", question: "", answer: "", language: "es", isActive: true, displayOrder: 0 };
const toInit = (f: LandingFaq): FaqInput => { const { id: _id, ...rest } = f; void _id; return rest; };

export function useFaqForm(initial?: LandingFaq) {
  const [form, setForm] = useState<FaqInput>(initial ? toInit(initial) : DEF);
  const set: SetF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canSave = form.question.trim().length >= 5 && form.answer.trim().length >= 10;
  return { form, set, canSave };
}
