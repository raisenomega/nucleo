// Portal P2 — órdenes y facturas del cliente (solo lectura + acciones vía RPC con validación de propiedad).
export interface OrderItem { readonly name: string; readonly qty: number; readonly price: number }

export interface CustomerOrder {
  readonly id: string; readonly orderNumber: string; readonly status: string; readonly total: number; readonly currency: string;
  readonly createdAt: string; readonly paymentMethodKey: string; readonly items: readonly OrderItem[];
  readonly linkedInvoiceId: string | null; readonly clientConfirmedAt: string | null; readonly paidAt: string | null;
}

export interface CustomerInvoice {
  readonly id: string; readonly invoiceNumber: string; readonly status: string; readonly total: number;
  readonly dueDate: string | null; readonly paidAt: string | null; readonly pdfUrl: string; readonly linkedOrderId: string | null;
}
