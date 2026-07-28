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
  sendDraftConfirm: "Al enviar, el documento pasará de Borrador a Enviado. ¿Continuar?",
  docCustomer: "REPORTE DE CLIENTE", docClientList: "LISTADO DE CLIENTES", docOrder: "COMPROBANTE DE ORDEN",
  docOrderList: "LISTADO DE ÓRDENES", docMarketingLeads: "LEADS COMERCIALES", docService: "COMPROBANTE DE SERVICIO",
  exportClientsPdf: "Exportar PDF", sendWhatsapp: "Enviar por WhatsApp", sendEmailPdf: "Enviar por email",
  photosBefore: "Antes", photosAfter: "Después", attachPhotos: "Adjuntar fotos de evidencia", sendServiceWa: "Enviar resumen al cliente por WhatsApp",
  totalClients: "Total clientes", totalDebt: "Deuda total", statement: "Estado de cuenta", activity: "Actividad reciente", viewInvoice: "Ver factura",
} satisfies Partial<Record<TranslationKey, string>>;
