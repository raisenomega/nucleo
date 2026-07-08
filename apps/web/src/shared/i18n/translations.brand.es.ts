import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (tab Plantillas / branding). Se fusiona en translations.ts.
export const esBrand = {
  templatesTab: "Plantillas", identitySection: "Identidad de la empresa",
  legalNameLbl: "Nombre legal", tradeName: "Nombre comercial", website: "Sitio web", taxId: "ID fiscal / EIN",
  colorsSection: "Colores y estilo", primaryColor: "Color primario", accentColor: "Color secundario",
  pdfPreview: "Vista previa del encabezado PDF", logoLbl: "Logo",
  templatesSection: "Plantillas PDF",
  templatesFuture: "Próximamente podrás elegir entre estilos: clásico, moderno, minimalista.",
} satisfies Partial<Record<TranslationKey, string>>;
