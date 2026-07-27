import { useState } from "react";
import { Check, Clock, Upload } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabaseScreeningRepository } from "@hr/infrastructure/supabase-screening.repository";
import type { ScreeningDoc } from "@hr/domain/screening.types";

// Lista de documentos requeridos con estado (subido/verificado) + subida directa al bucket (anón).
export function DocumentUploader({ applicantId, required, uploaded, onDone }: {
  applicantId: string; required: readonly string[]; uploaded: readonly ScreeningDoc[]; onDone: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const find = (name: string) => uploaded.find((u) => u.name === name);
  async function pick(name: string, file: File) {
    setBusy(name); setErr("");
    const r = await supabaseScreeningRepository.uploadDocument(applicantId, name, file);
    setBusy(null);
    if (r.ok) onDone(); else setErr(r.error);
  }
  return (
    <div className="space-y-2">
      {required.length === 0 && <p className="text-sm text-muted-foreground">{t("noRecords")}</p>}
      {required.map((name) => {
        const u = find(name);
        return (
          <div key={name} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
            <span className="text-foreground">{name}</span>
            {u ? (
              <span className={`flex items-center gap-1 text-xs font-bold ${u.verified ? "text-green-600" : "text-amber-600"}`}>
                {u.verified ? <><Check className="h-4 w-4" /> {t("verified")}</> : <><Clock className="h-4 w-4" /> {t("pendingVerification")}</>}</span>
            ) : (
              <label className="flex cursor-pointer items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-bold">
                <Upload className="h-3 w-3" /> {busy === name ? t("loading") : t("uploadDoc")}
                <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(name, f); }} /></label>
            )}
          </div>);
      })}
      {err && <p className="text-sm text-destructive">{err}</p>}
    </div>
  );
}
