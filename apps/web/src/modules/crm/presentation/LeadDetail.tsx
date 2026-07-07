import { useEffect, useState } from "react";
import { PhotoLightbox } from "@shared/components/PhotoLightbox";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { StatusBadge, TempBadge } from "@crm/presentation/LeadBadges";
import { LeadDetailActions } from "@crm/presentation/LeadDetailActions";
import type { Lead } from "@crm/domain/lead.types";

export function LeadDetail({ lead, onClose, onEdit, onDuplicate, onArchive }: {
  lead: Lead; onClose: () => void; onEdit: () => void; onDuplicate: () => void; onArchive: () => void;
}) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(lead.evidenceUrls).then(setUrls); }, [lead]);
  const row = (k: "phone" | "email" | "leadSource" | "serviceRequested", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v || "—"}</dd></div>
  );
  return (
    <>
      <ScreenModal onClose={onClose}>
        <div className="flex items-center justify-between gap-2 border-b border-border p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-primary">{lead.contactName}</h2>
            <TempBadge value={lead.temperature} /><StatusBadge value={lead.status} />
          </div>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <LeadDetailActions onEdit={onEdit} onDuplicate={onDuplicate} onArchive={onArchive} />
          <dl className="space-y-1 font-body text-sm">
            {row("phone", lead.phone)}{row("email", lead.email)}
            {row("leadSource", lead.leadSourceLabel)}{row("serviceRequested", lead.serviceTypeLabel)}
          </dl>
          {lead.items.length > 0 && (
            <div className="rounded-lg border border-border">
              {lead.items.map((it, i) => (
                <div key={i} className="flex justify-between border-b border-border px-3 py-1 text-sm last:border-0">
                  <span>{it.description} ×{it.quantity}</span><span className="font-semibold">{formatCurrency(it.lineTotal)}</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-1 text-sm font-bold text-primary">
                <span>{t("grandTotal")}</span><span>{formatCurrency(lead.quotedPrice)}</span>
              </div>
            </div>
          )}
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {urls.map((src, i) => <img key={i} src={src} alt="" onClick={() => setPhoto(src)} className="h-20 w-20 cursor-pointer rounded object-cover" />)}
            </div>
          )}
        </div>
      </ScreenModal>
      {photo && <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />}
    </>
  );
}
