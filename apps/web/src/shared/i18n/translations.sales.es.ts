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
  deliveryNotes: "Conduces", deliveryNote: "Conduce", conduce: "Conduce", noteNumber: "N.º conduce",
  deliveryNotesSubtitle: "Notas de entrega — despacho parcial, firma y evidencia; deduce el stock físico",
  dispatch: "Despachar", dispatchDate: "Fecha de despacho", shippingAddress: "Dirección de envío", shippingNotes: "Notas de envío",
  qtyDispatched: "Despachado", lot: "Lote", receivedBy: "Recibido por", evidencePhotos: "Fotos de evidencia", addPhoto: "Añadir foto",
  confirmDelivery: "Confirmar entrega", createDeliveryNote: "Crear conduce", dispatchConfirmation: "Confirmar despacho de",
  stockWillBeDeducted: "Se deducirá el stock físico de los items.", cannotUndo: "Esta acción no se puede deshacer.",
  dispatched: "Despachado", inTransit: "En tránsito", delivered: "Entregado", fromSalesOrder: "Orden",
  selectItems: "Selecciona al menos un ítem", noPendingItems: "No hay items pendientes de despacho", noDeliveryNotes: "Sin conduces",
} satisfies Partial<Record<TranslationKey, string>>;
