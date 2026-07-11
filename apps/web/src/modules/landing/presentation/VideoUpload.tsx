import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { supabase } from "@shared/lib/supabase";

// Sube video del hero directo a landing-assets/{tenant}/hero/ (sin crop). Guard de tamaño client-side
// ANTES del upload (para no gastar una subida que el bucket va a rechazar).
export function VideoUpload({ value, onChange, maxSizeMb = 50 }: {
  value: string | null; onChange: (url: string | null) => void; maxSizeMb?: number;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !session?.tenantId) return;
    if (f.size > maxSizeMb * 1024 * 1024) { window.alert(t("heroVideoTooSize")); return; }
    setBusy(true);
    const ext = f.name.split(".").pop() || "mp4";
    const path = `${session.tenantId}/hero/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("landing-assets").upload(path, f, { contentType: f.type, upsert: true });
    setBusy(false);
    if (up.error) { window.alert(t("uploadError")); return; }
    onChange(supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl);
  }
  return (
    <div className="space-y-2">
      {value && <video src={value} muted className="max-h-32 rounded-lg border border-border" />}
      <input type="file" accept="video/*" onChange={pick} disabled={busy} className="text-xs" />
      {busy && <p className="text-xs text-muted-foreground">{t("heroVideoUploading")}</p>}
      {value && !busy && <button type="button" onClick={() => onChange(null)} className="text-xs text-destructive">{t("heroVideoRemove")}</button>}
    </div>
  );
}
