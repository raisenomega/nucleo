// BC sales — conduces / notas de entrega (fulfillment). Puro. Nace de un SO; deduce físico al despachar.
export type DnResult = { ok: true; id?: string } | { ok: false; error: string };
export type DnStatus = "draft" | "dispatched" | "in_transit" | "delivered" | "cancelled";

export interface DeliveryNoteItem {
  readonly id: string; readonly soItemId: string | null; readonly productId: string | null; readonly itemId: string | null;
  readonly description: string; readonly qtyDispatched: number; readonly warehouseId: string | null; readonly lotId: string | null;
}
export interface EvidencePhoto { url: string; type: string; }
export interface DeliveryNote {
  readonly id: string; readonly noteNumber: string; readonly salesOrderId: string | null; readonly salesOrderNumber: string | null;
  readonly customerId: string; readonly customerName: string; readonly status: DnStatus;
  readonly dispatchDate: string | null; readonly deliveryDate: string | null; readonly shippingAddress: string | null; readonly shippingNotes: string | null;
  readonly receivedBy: string | null; readonly signatureData: string | null; readonly evidencePhotos: EvidencePhoto[];
  readonly notes: string | null; readonly items: DeliveryNoteItem[]; readonly createdAt: string;
}
export interface DnLineInput { soItemId: string; qtyDispatched: number; warehouseId?: string | null; lotId?: string | null; }
export interface DnInput { salesOrderId: string; items: DnLineInput[]; shippingNotes: string; notes: string; }
export interface DeliverInput { receivedBy: string; signature: string | null; photos: EvidencePhoto[]; }

export interface IDeliveryNoteRepository {
  list(): Promise<DeliveryNote[]>;
  create(input: DnInput): Promise<DnResult>;
  dispatch(id: string): Promise<DnResult>;
  deliver(id: string, input: DeliverInput): Promise<DnResult>;
  cancel(id: string, reason: string): Promise<DnResult>;
  invoiceFromDelivery(id: string): Promise<string | null>;
}
