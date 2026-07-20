import { useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@shared/providers/toast-context";
import { uploadMarketingMedia, type UploadKind } from "@raisen-marketing/infrastructure/upload-marketing-media";

// Uploader inmediato: sube al seleccionar → setea la URL (el Guardar del editor la persiste). Preview + eliminar.
// kind "avatar" → preview circular pequeño; hero (video/image) → preview rectangular ancho.
export function MediaUploadField({ label, kind, url, accept, onChange }: { label: string; kind: UploadKind; url: string | null; accept: string; onChange: (url: string | null) => void }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (ref.current) ref.current.value = "";
    if (!file) return;
    setBusy(true);
    const r = await uploadMarketingMedia(kind, file);
    setBusy(false);
    if (r.ok) { onChange(r.url); toast.success("Archivo subido"); } else toast.error(r.error);
  };
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {url && (kind === "video"
        ? <video src={url} muted loop autoPlay playsInline className="h-32 w-full rounded-lg object-cover" />
        : <img src={url} alt="" className={kind === "avatar" ? "h-24 w-24 rounded-full object-cover" : "h-32 w-full rounded-lg object-cover"} />)}
      <div className="flex gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{url ? "Reemplazar" : "Subir"}
        </button>
        {url && <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" />Eliminar</button>}
      </div>
      <input ref={ref} type="file" accept={accept} onChange={pick} className="hidden" />
    </div>
  );
}
