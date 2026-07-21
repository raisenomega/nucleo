import type { FooterRow } from "@raisen-marketing/data/footer.types";

// Fallback del footer. NO es la fuente primaria: desde la S24 el SSR siembra el footer desde la DB y este
// objeto solo se usa si Supabase no responde. Aun así hay que mantenerlo al día — el email llevaba dos
// sesiones desincronizado (hola@ cuando la DB ya decía ventas@). Las redes viven en marketing_footer_social_links.
export const FOOTER_FALLBACK: FooterRow = {
  id: "",
  taglineEs: "Tu negocio de servicio, bajo control total.", taglineEn: "Your service business, fully under control.",
  contactEmail: "ventas@raisen.agency", contactPhone: null,
  copyrightEs: "© {year} NÚCLEO. Una plataforma de Raisen Agency. Todos los derechos reservados.",
  copyrightEn: "© {year} NÚCLEO. A Raisen Agency platform. All rights reserved.",
};
