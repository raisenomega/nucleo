import type { FooterRow } from "@raisen-marketing/data/footer.types";

// Fallback del footer (idéntico al seed de la migr 204). La landing lo usa hasta que la DB responde.
export const FOOTER_FALLBACK: FooterRow = {
  id: "",
  taglineEs: "Tu negocio de servicio, bajo control total.", taglineEn: "Your service business, fully under control.",
  contactEmail: "hola@raisen.agency", contactPhone: null,
  instagram: null, facebook: null, linkedin: null, youtube: null, tiktok: null, x: null,
  copyrightEs: "© {year} NÚCLEO. Una plataforma de Raisen Agency. Todos los derechos reservados.",
  copyrightEn: "© {year} NÚCLEO. A Raisen Agency platform. All rights reserved.",
};
