import { useEffect, useState } from "react";
import { getTestimonialsConfig, getTestimonials } from "@raisen-marketing/infrastructure/marketing-testimonials.repository";
import type { TestimonialRow, TestimonialsConfig } from "@raisen-marketing/data/testimonial.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la config + los testimonios activos (ordenados) al montar. null hasta resolver → usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingTestimonials() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<TestimonialsConfig | null>(ssr?.testimonialsConfig ?? null);
  const [testimonials, setTestimonials] = useState<TestimonialRow[] | null>(ssr?.testimonials ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getTestimonialsConfig().then(setConfig);
    void getTestimonials(true).then(setTestimonials);
  }, [ssr]);
  return { config, testimonials };
}
