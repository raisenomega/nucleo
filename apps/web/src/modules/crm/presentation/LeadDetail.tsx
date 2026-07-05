import { useEffect, useState } from "react";
import { FileText, MessageCircle, Receipt, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { StatusBadge, TempBadge } from "@crm/presentation/LeadBadges";
import type { Lead } from "@crm/domain/lead.types";

export function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(lead.evidenceUrls).then(setUrls); }, [lead]);
  const soon = () => window.alert(t("comingSoon"));
  const wa = () => window.open(`https://wa.me/${lead.phone.replace(/\D/g, "")}`, "_blank");
  const btn = "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-body font-bold";
  const row = (k: "phone" | "email" | "leadSource" | "serviceRequested", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v || "—"}</dd></div>
  );
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-primary">{lead.contactName}</h2>
              <TempBadge value={lead.temperature} /><StatusBadge value={lead.status} />
            </div>
            <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
          </div>
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
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={wa} className={`${btn} bg-green-600 text-white`}><MessageCircle className="h-4 w-4" /> {t("whatsapp")}</button>
            <button type="button" onClick={soon} className={`${btn} bg-secondary text-foreground`}><FileText className="h-4 w-4" /> {t("quote")}</button>
            <button type="button" onClick={soon} className={`${btn} bg-secondary text-foreground`}><Receipt className="h-4 w-4" /> {t("invoice")}</button>
          </div>
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {urls.map((src, i) => <img key={i} src={src} alt="" onClick={() => setPhoto(src)} className="h-20 w-20 cursor-pointer rounded object-cover" />)}
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
