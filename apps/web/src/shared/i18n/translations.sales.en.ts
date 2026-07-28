import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Sales Orders / fulfillment). Merged in translations.ts.
export const enSales = {
  salesOrders: "Sales Orders",
  salesSubtitle: "Sales orders with stock reservation — quote → order → delivery note → invoice",
  createSalesOrder: "New sales order", createFromQuote: "Create sales order",
  confirmOrder: "Confirm order", cancelOrder: "Cancel order", createInvoice: "Create invoice",
  deliveryDate: "Delivery date", notesCustomer: "Notes for the customer", customerRequired: "Select a customer",
  qtyOrdered: "Ordered", qtyShipped: "Shipped", qtyInvoiced: "Invoiced", qtyBackordered: "Backorder", qtyPending: "Pending",
  backorderTitle: "Insufficient stock",
  backorderWarning: "Some items don't have enough stock. The order was confirmed with the available partial reservation; the rest is on backorder until restocked.",
  understood: "Got it", noSalesOrders: "No sales orders",
  soOpen: "Open", soToShip: "To ship", soValue: "Value", reserved: "Reserved", physicalStock: "Physical",
  soDraft: "Draft", soConfirmed: "Confirmed", soPartiallyShipped: "Partially shipped", soShipped: "Shipped",
  soPartiallyInvoiced: "Partially invoiced", soInvoiced: "Invoiced", soClosed: "Closed", soCancelled: "Cancelled",
} satisfies Partial<Record<TranslationKey, string>>;
