import type { LegalLink } from "@raisen-marketing/data/legal.types";

// Fallback de los links legales del footer (seed migr 206). Se muestra hasta que la DB responde → los
// links no parpadean durante la carga. Tras cargar, refleja las páginas is_active reales.
export const LEGAL_LINKS_FALLBACK: LegalLink[] = [
  { slug: "privacidad", titleEs: "Política de Privacidad", titleEn: "Privacy Policy" },
  { slug: "terminos", titleEs: "Términos de Servicio", titleEn: "Terms of Service" },
  { slug: "cookies", titleEs: "Política de Cookies", titleEn: "Cookie Policy" },
];
