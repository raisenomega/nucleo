import { useEffect, useState } from "react";
import { Camera, Check, X, Loader2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { compressImage } from "@shared/lib/image-compress";
import { signEvidence, removeEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { uploadItemPhoto, persistItemPhotos } from "@fieldops/infrastructure/item-photos";

const SLOTS = [0, 1, 2];
// 3 slots de foto por artículo (patrón evidencia rutas, sr-only iOS). Comprime → sube a Storage → UPDATE inmediato.
export function ItemPhotoUploader({ tenantId, itemId, value, onChange }: {
  tenantId: string; itemId: string; value: readonly string[]; onChange: (paths: string[]) => void;
}) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (!value.length) { setUrls({}); return; }
    void signEvidence(value).then((s) => setUrls(Object.fromEntries(value.map((p, i) => [p, s[i] ?? ""]))));
  }, [value]);
  async function pick(e: React.ChangeEvent<HTMLInputElement>, slot: number) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setBusy(slot);
    const path = await uploadItemPhoto(tenantId, itemId, await compressImage(f));
    setBusy(null);
    if (!path) return void window.alert(t("uploadError"));
    const next = [...value, path]; await persistItemPhotos(itemId, next); onChange(next);
  }
  async function del(path: string) {
    await removeEvidence([path]); const next = value.filter((p) => p !== path);
    await persistItemPhotos(itemId, next); onChange(next);
  }
  return (
    <div className="flex gap-2">
      {SLOTS.map((slot) => {
        const path = value[slot];
        if (path) return (
          <div key={slot} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
            <img src={urls[path] ?? ""} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-0.5 left-0.5 rounded-full bg-green-600 p-0.5"><Check className="h-2.5 w-2.5 text-white" /></span>
            <button type="button" onClick={() => void del(path)} aria-label={t("delete")} className="absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-red-600/90"><X className="h-4 w-4 text-white" /></button>
          </div>);
        return (
          <label key={slot} className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-secondary/40">
            {busy === slot ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
            <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy === slot} onChange={(e) => void pick(e, slot)} />
          </label>);
      })}
    </div>
  );
}
