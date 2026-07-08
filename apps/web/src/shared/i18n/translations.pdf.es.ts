import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (PDFs Gotenberg). Se fusiona en translations.ts.
export const esPdf = {
  downloadPdf: "Descargar PDF", generatingPdf: "Generando PDF…", pdfReady: "PDF listo",
  pdfError: "No se pudo generar el PDF. Intenta de nuevo.", exportPdf: "Exportar PDF",
  fiscalReport: "Reporte fiscal", payslipPdf: "Recibo PDF",
} satisfies Partial<Record<TranslationKey, string>>;
