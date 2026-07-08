import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (PDFs Gotenberg). Se fusiona en translations.ts.
export const esPdf = {
  downloadPdf: "Descargar PDF", generatingPdf: "Generando PDF…", pdfReady: "PDF listo",
  pdfError: "No se pudo generar el PDF. Intenta de nuevo.", exportPdf: "Exportar PDF",
  fiscalReport: "Reporte fiscal", payslipPdf: "Recibo PDF",
  receiptPdf: "Recibo PDF", inventoryReport: "Reporte inventario", debtsReport: "Reporte deudas",
  certificatePdf: "Certificado PDF", routePdf: "Resumen PDF",
  showing: "Mostrando", ofTotal: "de", prev: "Anterior", next: "Siguiente",
  from: "Desde", to: "Hasta", generateReport: "Generar reporte",
} satisfies Partial<Record<TranslationKey, string>>;
