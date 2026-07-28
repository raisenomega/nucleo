import { supabase } from "@shared/lib/supabase";
import type { IDeliveryNoteRepository, DeliveryNote, DeliveryNoteItem, DnStatus, DnResult, DnInput, DeliverInput, EvidencePhoto } from "@sales/domain/delivery-note.types";

interface IRow { id: string; so_item_id: string | null; product_id: string | null; item_id: string | null; description: string; qty_dispatched: number; warehouse_id: string | null; lot_id: string | null; }
interface Row {
  id: string; note_number: string; sales_order_id: string | null; customer_id: string; status: string;
  dispatch_date: string | null; delivery_date: string | null; shipping_address: string | null; shipping_notes: string | null;
  received_by: string | null; signature_data: string | null; evidence_photos: EvidencePhoto[] | null; notes: string | null; created_at: string;
  customer: { full_name: string | null } | null; sales_order: { order_number: string | null } | null; items: IRow[] | null;
}
const SEL = "id,note_number,sales_order_id,customer_id,status,dispatch_date,delivery_date,shipping_address,shipping_notes,received_by,signature_data,evidence_photos,notes,created_at,customer:customer_profiles(full_name),sales_order:sales_orders(order_number),items:delivery_note_items(id,so_item_id,product_id,item_id,description,qty_dispatched,warehouse_id,lot_id)";
const ok = (e: { message: string } | null, id?: string): DnResult => (e ? { ok: false, error: e.message } : { ok: true, id });
const toItem = (r: IRow): DeliveryNoteItem => ({ id: r.id, soItemId: r.so_item_id, productId: r.product_id, itemId: r.item_id, description: r.description, qtyDispatched: r.qty_dispatched, warehouseId: r.warehouse_id, lotId: r.lot_id });
const toDn = (r: Row): DeliveryNote => ({ id: r.id, noteNumber: r.note_number, salesOrderId: r.sales_order_id, salesOrderNumber: r.sales_order?.order_number ?? null, customerId: r.customer_id, customerName: r.customer?.full_name ?? "—", status: r.status as DnStatus, dispatchDate: r.dispatch_date, deliveryDate: r.delivery_date, shippingAddress: r.shipping_address, shippingNotes: r.shipping_notes, receivedBy: r.received_by, signatureData: r.signature_data, evidencePhotos: r.evidence_photos ?? [], notes: r.notes, items: (r.items ?? []).map(toItem), createdAt: r.created_at });

export const supabaseDeliveryNoteRepository: IDeliveryNoteRepository = {
  async list(): Promise<DeliveryNote[]> {
    const { data } = await supabase.from("delivery_notes").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toDn);
  },
  async create(d): Promise<DnResult> {
    const { data, error } = await supabase.rpc("create_delivery_note", { p_sales_order_id: d.salesOrderId,
      p_items: d.items.map((i) => ({ so_item_id: i.soItemId, qty_dispatched: i.qtyDispatched, warehouse_id: i.warehouseId ?? null, lot_id: i.lotId ?? null })),
      p_shipping_notes: d.shippingNotes || null, p_notes: d.notes || null });
    return ok(error, (data as string | null) ?? undefined);
  },
  async dispatch(id): Promise<DnResult> {
    return ok((await supabase.rpc("dispatch_delivery_note", { p_note_id: id })).error);
  },
  async deliver(id, d: DeliverInput): Promise<DnResult> {
    return ok((await supabase.rpc("deliver_delivery_note", { p_note_id: id, p_received_by: d.receivedBy || null, p_signature: d.signature, p_photos: d.photos })).error);
  },
  async cancel(id, reason): Promise<DnResult> {
    return ok((await supabase.rpc("cancel_delivery_note", { p_note_id: id, p_reason: reason || null })).error);
  },
  async invoiceFromDelivery(id): Promise<string | null> {
    const { data } = await supabase.rpc("create_invoice_from_delivery", { p_delivery_note_id: id });
    return (data as string | null) ?? null;
  },
};
