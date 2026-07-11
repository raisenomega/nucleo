import { useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { cropToWebpAndUpload } from "@shared/lib/crop-upload";
import { FileUploadButton } from "@shared/components/FileUploadButton";
import { FilePreviewActions } from "@shared/components/FilePreviewActions";

// Sube imagen con recorte (react-image-crop) → WebP → landing-assets/{tenant}/{entityType}/.
export function ImageUploadWithCrop({ entityType, aspectRatio, maxWidthPx, value, onUploaded }: {
  entityType: string; aspectRatio?: number; maxWidthPx?: number; value: string | null; onUploaded: (url: string | null) => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
  const [busy, setBusy] = useState(false);

  const onFile = (f: File) => setSrc(URL.createObjectURL(f));
  async function save() {
    if (!imgRef.current || !session?.tenantId) return;
    setBusy(true);
    const url = await cropToWebpAndUpload(imgRef.current, crop, session.tenantId, entityType, maxWidthPx ?? 1920);
    setBusy(false);
    if (url) { onUploaded(url); setSrc(null); } else window.alert(t("uploadError"));
  }

  return (
    <div className="space-y-2">
      {value && !src && <img src={value} alt="" className="max-h-32 rounded-lg border border-border" />}
      {!src && (value
        ? <FilePreviewActions onRemove={() => onUploaded(null)}>
            <FileUploadButton accept="image/*" label={t("uploadReplace")} onFileSelect={onFile} />
          </FilePreviewActions>
        : <FileUploadButton accept="image/*" onFileSelect={onFile} />)}
      {src && <>
        <ReactCrop crop={crop} onChange={(_c, pc) => setCrop(pc)} aspect={aspectRatio}>
          <img ref={imgRef} src={src} alt="" className="max-h-72" />
        </ReactCrop>
        <button type="button" disabled={busy} onClick={() => void save()}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {busy ? t("sending") : t("save")}</button>
      </>}
    </div>
  );
}
