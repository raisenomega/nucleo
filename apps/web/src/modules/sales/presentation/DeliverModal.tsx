import { useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { SignaturePad } from "@shared/components/SignaturePad";
import { compressImage } from "@shared/lib/image-compress";
import { uploadDeliveryPhoto } from "@finance/infrastructure/supabase-evidence.storage";
import type { DeliverInput, EvidencePhoto } from "@sales/domain/delivery-note.types";

// Confirmar entrega: recibido por + firma (SignaturePad) + fotos (bucket evidence). Firma/fotos opcionales.
export function DeliverModal({ noteId, noteNumber, onDeliver, onClose }: {
  noteId: string; noteNumber: string; onDeliver: (d: DeliverInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n(); const { session } = useSession();
  const [receivedBy, setReceivedBy] = useState(""); const [sig, setSig] = useState<string | null>(null);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]); const [busy, setBusy] = useState(false); const [up, setUp] = useState(false);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f || !session?.tenantId) return;
    setUp(true);
    const jpeg = await compressImage(f);
    const path = jpeg ? await uploadDeliveryPhoto(session.tenantId, noteId, jpeg) : null;
    setUp(false);
    if (path) setPhotos((p) => [...p, { url: path, type: "delivery" }]); else window.alert(t("uploadError"));
  }
  const submit = async () => { setBusy(true); await onDeliver({ receivedBy, signature: sig, photos }); setBusy(false); };
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("confirmDelivery")} — {noteNumber}</h2>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("receivedBy")}</span>
          <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={fld} /></label>
        <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("signature")}</span><SignaturePad onChange={setSig} /></div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-muted-foreground">{t("evidencePhotos")}</span>
          <div className="flex flex-wrap items-center gap-2">
            {photos.map((p, i) => <span key={i} className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs text-green-600"><Check className="h-3 w-3" />{i + 1}</span>)}
            <label className="flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-secondary px-3 text-sm">
              {up ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {t("addPhoto")}
              <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={up} onChange={(e) => void pick(e)} /></label>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void submit()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("confirmDelivery")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
