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
  docIncomeReceipt: "RECIBO DE INGRESO", docExpenseReceipt: "COMPROBANTE DE GASTO", docExtraordinary: "PAGO EXTRAORDINARIO",
  concept: "Concepto", payslipDisclaimer: "Documento informativo — no sustituye asesoría de un CPA. Cálculos según la configuración fiscal del negocio (Puerto Rico).",
  docCertificate: "CERTIFICADO", certTitle: "CERTIFICADO DE CAPACITACIÓN", certCertifies: "certifica que",
  certCompleted: "completó satisfactoriamente el curso", certAuthorized: "Firma autorizada",
  evalDocTitle: "EVALUACIÓN DE DESEMPEÑO", evalProbation: "En período probatorio", criterion: "Criterio", evalLegalTitle: "Requiere validación legal (Ley 80)",
  docLead: "FICHA DE LEAD", wmDraft: "BORRADOR", wmPaid: "PAGADA", wmVoided: "ANULADA", wmOverdue: "VENCIDA",
  wmAccepted: "APROBADA", wmRejected: "RECHAZADA", wmExpired: "EXPIRADA",
} satisfies Partial<Record<TranslationKey, string>>;
