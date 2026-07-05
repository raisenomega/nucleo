import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { StatusBadge, TempBadge } from "@crm/presentation/LeadBadges";
import type { Lead } from "@crm/domain/lead.types";

export function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(lead.evidenceUrls).then(setUrls); }, [lead]);
  const row = (k: "callDate" | "phone" | "email" | "serviceRequested" | "leadSource" | "callNotes", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v || "—"}</dd></div>
  );
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="w-full max-w-lg space-y-3 rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-primary">{lead.contactName}</h2>
              <TempBadge value={lead.temperature} /><StatusBadge value={lead.status} />
            </div>
            <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
          </div>
          <dl className="space-y-1 font-body text-sm">
            {row("callDate", lead.callDate)}{row("phone", lead.phone)}{row("email", lead.email)}
            {row("serviceRequested", lead.serviceRequested)}{row("leadSource", lead.leadSource)}
            {row("callNotes", lead.notes)}
          </dl>
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {urls.map((src, i) => <img key={i} src={src} alt="" onClick={() => setPhoto(src)} className="h-24 w-24 cursor-pointer rounded object-cover" />)}
            </div>
          )}
        </div>
      </div>
      {photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPhoto(null)}>
          <button type="button" onClick={() => setPhoto(null)} aria-label={t("cancel")} className="absolute right-4 top-4 text-white"><X className="h-6 w-6" /></button>
          <img src={photo} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}
