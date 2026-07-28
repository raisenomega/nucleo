import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

type T = (k: TranslationKey) => string;

// Loader conduce → SalesDocPdf en modo "NOTA DE ENTREGA": sin totales de dinero; cols Desc/Qty/Almacén/Lote.
// warehouses = map warehouseId→nombre (resuelto por el caller para no meter fetch en el reconciler).
export async function deliveryNoteDoc(dn: DeliveryNote, warehouses: Record<string, string>, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const num = `${t("conduce").toUpperCase()} ${dn.noteNumber}`;
  const rows = dn.items.map((i) => [i.description, i.qtyDispatched, i.warehouseId ? warehouses[i.warehouseId] ?? "" : "", i.lotId ? "✓" : ""]);
  const sections = [
    ...(dn.notes ? [{ title: t("shippingNotes"), body: dn.notes }] : []),
    { title: t("receivedBy"), body: dn.receivedBy || "________________________" },
  ];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num}
    metaLines={[...(dn.salesOrderNumber ? [`${t("fromSalesOrder")}: ${dn.salesOrderNumber}`] : []),
      ...(dn.dispatchDate ? [`${t("dispatchDate")}: ${dn.dispatchDate}`] : [])]}
    clientTitle={t("clientName")} clientName={dn.customerName} clientLines={[dn.shippingAddress ?? ""]}
    itemHeaders={[t("description"), t("qtyDispatched"), t("warehouse"), t("lot")]} itemWidths={[46, 18, 24, 12]}
    itemRows={rows} totals={[]} sections={sections} />;
}
