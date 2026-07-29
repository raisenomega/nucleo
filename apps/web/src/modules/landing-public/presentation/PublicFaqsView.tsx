import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { publicLandingHref } from "@shared/lib/public-landing-href";
import type { PublicFaqsResp } from "@landing-public/infrastructure/public-faqs.repository";

// Página pública branded de todas las FAQs del tenant (acordeón). Enlazada desde el preview del landing.
export function PublicFaqsView({ data }: { data: PublicFaqsResp }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const tn = data.tenant; const faqs = data.faqs ?? [];
  if (data.status !== "valid" || !tn) return <main className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">{t("pdfNotAvailable")}</main>;
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div className="flex items-center gap-3">
          {tn.logo_url && <img src={tn.logo_url} alt="" className="h-10 w-10 object-contain" />}
          <span className="font-display font-bold" style={{ color: tn.primary_color ?? undefined }}>{tn.display_name}</span>
        </div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{t("lpFaqsTitle")}</h1>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-border">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-2 p-3 text-left font-bold">
                {f.question}<ChevronDown className={`h-4 w-4 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="whitespace-pre-line border-t border-border p-3 text-sm text-muted-foreground">{f.answer}</p>}
            </div>
          ))}
        </div>
        <a href={publicLandingHref()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-bold text-foreground"><ArrowLeft className="h-4 w-4" /> {t("backToHome")}</a>
      </div>
    </main>
  );
}
