import { useEffect, useState } from "react";
import { getTestimonialsConfig, getTestimonials } from "@raisen-marketing/infrastructure/marketing-testimonials.repository";
import type { TestimonialRow, TestimonialsConfig } from "@raisen-marketing/data/testimonial.types";

// Lee la config + los testimonios activos (ordenados) al montar. null hasta resolver → usa el fallback.
export function useMarketingTestimonials() {
  const [config, setConfig] = useState<TestimonialsConfig | null>(null);
  const [testimonials, setTestimonials] = useState<TestimonialRow[] | null>(null);
  useEffect(() => {
    void getTestimonialsConfig().then(setConfig);
    void getTestimonials(true).then(setTestimonials);
  }, []);
  return { config, testimonials };
}
