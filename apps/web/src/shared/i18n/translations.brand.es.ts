import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (branding: tab Plantillas + /settings/temas). Se fusiona en translations.ts.
export const esBrand = {
  templatesTab: "Plantillas", identitySection: "Identidad de la empresa",
  legalNameLbl: "Nombre legal", tradeName: "Nombre comercial", website: "Sitio web", taxId: "ID fiscal / EIN",
  colorsSection: "Colores y estilo", primaryColor: "Color primario", accentColor: "Color de acento",
  pdfPreview: "Vista previa del encabezado PDF", logoLbl: "Logo",
  templatesSection: "Plantillas PDF",
  templatesFuture: "Próximamente podrás elegir entre estilos: clásico, moderno, minimalista.",
  // ── /settings/temas ──
  themesTab: "Temas", themesTitle: "Personaliza tu marca", themesSubtitle: "Los cambios afectan cómo se ve la plataforma para tu equipo.",
  identityHeader: "Identidad", shortNameLbl: "Nombre corto", shortNameHelp: "Aparece en el sidebar y title del navegador.",
  faviconLbl: "Favicon", assetsHelp: "PNG, JPG, WebP o SVG. Máximo 500 KB.",
  colorsHeader: "Colores", secondaryColor: "Color secundario",
  sidebarBg: "Fondo del sidebar", sidebarText: "Texto del sidebar", sidebarHover: "Hover del sidebar",
  dangerColor: "Color de error", successColor: "Color de éxito", warningColor: "Color de advertencia",
  defaultModeHeader: "Modo por defecto", lightMode: "Claro", darkMode: "Oscuro", autoMode: "Automático — según el sistema",
  restoreSectionDefaults: "Restaurar defaults de esta sección", cancelBtn: "Cancelar", saveBtn: "Guardar cambios",
  saveSuccess: "Cambios guardados.", saveErrorFull: "No se pudieron guardar los cambios.",
  saveErrorPartial: "Los datos de identidad se guardaron, pero los colores no. Reintenta.",
  fileTooLarge: "Archivo demasiado grande. Máximo 500 KB.",
  fileFormatUnsupported: "Formato no soportado. Usa PNG, JPG, WebP o SVG.",
} satisfies Partial<Record<TranslationKey, string>>;
