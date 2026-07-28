import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (Órdenes de venta / fulfillment). Se fusiona en translations.ts.
export const esSales = {
  salesOrders: "Órdenes de venta",
  salesSubtitle: "Órdenes de venta con reserva de stock — cotización → orden → conduce → factura",
  createSalesOrder: "Crear orden de venta", createFromQuote: "Crear orden de venta",
  confirmOrder: "Confirmar orden", cancelOrder: "Cancelar orden", createInvoice: "Crear factura",
  deliveryDate: "Fecha de entrega", notesCustomer: "Notas para el cliente", customerRequired: "Selecciona un cliente",
  qtyOrdered: "Ordenado", qtyShipped: "Despachado", qtyInvoiced: "Facturado", qtyBackordered: "Backorder", qtyPending: "Pendiente",
  backorderTitle: "Stock insuficiente",
  backorderWarning: "Algunos ítems no tienen stock suficiente. La orden se confirmó con la reserva parcial disponible; el resto queda en backorder hasta reponer.",
  understood: "Entendido", noSalesOrders: "Sin órdenes de venta",
  soOpen: "Abiertas", soToShip: "Por despachar", soValue: "Valor", reserved: "Reservado", physicalStock: "Físico",
  soDraft: "Borrador", soConfirmed: "Confirmada", soPartiallyShipped: "Despacho parcial", soShipped: "Despachada",
  soPartiallyInvoiced: "Factura parcial", soInvoiced: "Facturada", soClosed: "Cerrada", soCancelled: "Cancelada",
} satisfies Partial<Record<TranslationKey, string>>;
