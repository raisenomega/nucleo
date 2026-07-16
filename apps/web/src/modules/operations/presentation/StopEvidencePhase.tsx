import { useEffect, useState } from "react";
import { Camera, Check, Trash2, Loader2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { compressImage } from "@shared/lib/image-compress";
import { uploadStopPhoto, signEvidence, removeEvidence } from "@finance/infrastructure/supabase-evidence.storage";

const SLOTS = [0, 1, 2];
// 3 slots de foto de una fase (antes/después). Cada foto: comprime → sube a Storage → persiste su ruta vía onChange
// (UPDATE inmediato). Recarga miniaturas firmando las rutas guardadas. Persistente entre sesiones.
export function StopEvidencePhase({ tenantId, routeId, stopId, phase, value, onChange }: {
  tenantId: string; routeId: string; stopId: string; phase: "before" | "after"; value: readonly string[]; onChange: (paths: string[]) => void;
}) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (!value.length) return void setUrls({});
    void signEvidence(value).then((s) => setUrls(Object.fromEntries(value.map((p, i) => [p, s[i] ?? ""]))));
  }, [value]);
  async function pick(e: React.ChangeEvent<HTMLInputElement>, slot: number) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setBusy(slot);
    const path = await uploadStopPhoto(tenantId, routeId, stopId, phase, await compressImage(f));
    setBusy(null);
    if (path) onChange([...value, path]); else window.alert(t("uploadError"));
  }
  async function del(path: string) { await removeEvidence([path]); onChange(value.filter((p) => p !== path)); }
  return (
    <div className="grid grid-cols-3 gap-2">
      {SLOTS.map((slot) => {
        const path = value[slot];
        if (path) return (
          <div key={slot} className="relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={urls[path] ?? ""} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded-full bg-green-600 p-0.5"><Check className="h-3 w-3 text-white" /></span>
            <button type="button" onClick={() => void del(path)} aria-label={t("delete")} className="absolute right-1 top-1 rounded-full bg-red-600 p-1"><Trash2 className="h-3 w-3 text-white" /></button>
          </div>);
        return (
          <label key={slot} className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/40">
            {busy === slot ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
            <input type="file" accept="image/*" capture="environment" hidden disabled={busy !== null} onChange={(e) => void pick(e, slot)} />
          </label>);
      })}
    </div>
  );
}
