import type { FooterRow } from "@raisen-marketing/data/footer.types";

// Fallback del footer (seed migr 204). La landing lo usa hasta que la DB responde. Las redes ya no viven
// aquí: se leen de marketing_footer_social_links (migr 210).
export const FOOTER_FALLBACK: FooterRow = {
  id: "",
  taglineEs: "Tu negocio de servicio, bajo control total.", taglineEn: "Your service business, fully under control.",
  contactEmail: "hola@raisen.agency", contactPhone: null,
  copyrightEs: "© {year} NÚCLEO. Una plataforma de Raisen Agency. Todos los derechos reservados.",
  copyrightEn: "© {year} NÚCLEO. A Raisen Agency platform. All rights reserved.",
};
