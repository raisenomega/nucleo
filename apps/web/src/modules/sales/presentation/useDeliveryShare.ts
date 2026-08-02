import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { shareViaWhatsApp, docWaMessage } from "@shared/lib/share-whatsapp";
import { deliveryNoteDoc } from "@sales/presentation/pdf/delivery-note-pdf";
import { getDeliveryShareUrl } from "@sales/infrastructure/supabase-delivery-share.repository";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

// PDF client-side del conduce + WhatsApp con link BRANDED /entrega/$token (V7, dominio del tenant).
export function useDeliveryShare(warehouses: Record<string, string>) {
  const { t } = useI18n(); const { exportPdf } = usePdfExport(); const brand = usePdfBrand();
  const download = (n: DeliveryNote) => void exportPdf(() => deliveryNoteDoc(n, warehouses, brand, t));
  const share = (n: DeliveryNote) => void getDeliveryShareUrl(n.id).then((r) => {
    if (!r.ok) { window.alert(r.error); return; }   // sin enlace no se abre WhatsApp (ver InvoiceDetail)
    shareViaWhatsApp(null, docWaMessage(`${t("conduce")} ${n.noteNumber}`, t("viewDetail"), r.value));
  });
  return { download, share };
}
