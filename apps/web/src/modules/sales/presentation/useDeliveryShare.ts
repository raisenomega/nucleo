import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { usePdfShare } from "@shared/hooks/usePdfShare";
import { shareViaWhatsApp, docWaMessage } from "@shared/lib/share-whatsapp";
import { deliveryNoteDoc } from "@sales/presentation/pdf/delivery-note-pdf";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

// PDF client-side del conduce + envío WhatsApp (PDF a tenant-pdfs + signed URL 7d; página pública /entrega = V7).
export function useDeliveryShare(warehouses: Record<string, string>) {
  const { t } = useI18n(); const { exportPdf } = usePdfExport(); const brand = usePdfBrand(); const { sharePdf } = usePdfShare();
  const download = (n: DeliveryNote) => void exportPdf(() => deliveryNoteDoc(n, warehouses, brand, t));
  const share = (n: DeliveryNote) => void sharePdf(() => deliveryNoteDoc(n, warehouses, brand, t), `delivery/${n.noteNumber}.pdf`)
    .then((url) => shareViaWhatsApp(null, docWaMessage(`${t("conduce")} ${n.noteNumber}`, t("viewDetail"), url)));
  return { download, share };
}
