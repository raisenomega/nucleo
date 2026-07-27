// Tipos/constantes de marca SIN importar @react-pdf/renderer → seguro de importar desde componentes
// que se renderizan en SSR (los detail views). El react-pdf real solo entra por import dinámico.
export interface PdfBrand { name: string; logo: string | null; primaryColor: string; accentColor: string; }
// Defaults idénticos al backend Gotenberg (base.html) para paridad visual.
export const DEFAULT_PDF_COLORS = { primary: "rgb(26, 26, 46)", accent: "rgb(74, 74, 106)" };
