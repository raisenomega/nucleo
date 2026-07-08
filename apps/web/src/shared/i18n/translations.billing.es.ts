import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (Facturación). Se fusiona en translations.ts.
export const esBilling = {
  billingSubtitle: "Facturas, planes recurrentes y órdenes web — todo termina en ingreso",
  newInvoice: "Nueva factura", recurringPlans: "Planes recurrentes", newPlan: "Nuevo plan",
  clientName: "Cliente", invoiceNumber: "N.º factura", dueDate: "Vence", nextBilling: "Próximo cobro",
  saveDraft: "Guardar borrador", markPaid: "Marcar pagada", generateInvoices: "Generar facturas del mes",
  generateInvoice: "Generar factura", pause: "Pausar", resume: "Reactivar",
  isDraft: "Borrador", isSent: "Enviada", isPaid: "Pagada", isOverdue: "Vencida", isCancelled: "Cancelada",
  psActive: "Activo", psPaused: "Pausado", psCancelled: "Cancelado",
  freqQuarterly: "Trimestral", freqAnnual: "Anual",
  kpiPending: "Pendientes", kpiOverdue: "Vencidas", kpiMrr: "MRR",
} satisfies Partial<Record<TranslationKey, string>>;
