import { Check, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabaseScreeningRepository } from "@hr/infrastructure/supabase-screening.repository";
import type { Applicant } from "@hr/domain/recruitment.types";

// Verificación de documentos (staff): ver el doc firmado + marcar verificado/rechazado.
export function DocVerifyList({ applicantId, docs, onChanged }: {
  applicantId: string; docs: Applicant["documentsUploaded"]; onChanged: () => void;
}) {
  const { t } = useI18n();
  const verified = docs.filter((d) => d.verified).length;
  async function view(path: string) { const url = await supabaseScreeningRepository.signDoc(path); if (url) window.open(url, "_blank"); }
  async function toggle(name: string, v: boolean) { await supabaseScreeningRepository.verifyDocument(applicantId, name, v); onChanged(); }
  if (docs.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("documents")} {verified}/{docs.length}</p>
      {docs.map((d, i) => (
        <div key={i} className="flex items-center justify-between rounded border border-border p-1.5 text-sm">
          <button type="button" onClick={() => void view(d.url)} className="truncate text-primary hover:underline">{d.name}</button>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => void toggle(d.name, true)} aria-label={t("verified")} className={d.verified ? "text-green-600" : "text-muted-foreground hover:text-foreground"}><Check className="h-4 w-4" /></button>
            <button type="button" onClick={() => void toggle(d.name, false)} aria-label={t("reject")} className={!d.verified ? "text-destructive" : "text-muted-foreground hover:text-foreground"}><X className="h-4 w-4" /></button>
          </div>
        </div>))}
    </div>
  );
}
