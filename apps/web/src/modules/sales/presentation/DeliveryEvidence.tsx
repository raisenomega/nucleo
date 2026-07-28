import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { ImageLightbox } from "@shared/components/ImageLightbox";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import type { EvidencePhoto } from "@sales/domain/delivery-note.types";

// Firma (data-URL base64) + fotos de evidencia (rutas del bucket evidence → signed URLs 1h). Solo lectura.
export function DeliveryEvidence({ signature, photos }: { signature: string | null; photos: readonly EvidencePhoto[] }) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]); const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (photos.length) void signEvidence(photos.map((p) => p.url)).then(setUrls); }, [photos]);
  if (!signature && photos.length === 0) return null;
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      {signature && <div><p className="text-xs font-bold text-muted-foreground">{t("signature")}</p><img src={signature} alt="" className="h-20 rounded border border-border bg-white" /></div>}
      {photos.length > 0 && <div className="flex flex-wrap gap-2">{urls.map((u, i) => (
        <button key={i} type="button" onClick={() => setOpen(u)} className="h-16 w-16 overflow-hidden rounded border border-border"><img src={u} alt="" className="h-full w-full object-cover" /></button>))}</div>}
      {open && <ImageLightbox src={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
