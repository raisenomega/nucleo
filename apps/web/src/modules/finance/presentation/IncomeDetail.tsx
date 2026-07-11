import { useEffect, useState } from "react";
import { PhotoLightbox } from "@shared/components/PhotoLightbox";
import { X, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import type { Income } from "@finance/domain/income.types";

export function IncomeDetail({ income, onClose }: { income: Income; onClose: () => void }) {
  const { t } = useI18n();
  const pdf = usePdf();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(income.evidenceUrls).then(setUrls); }, [income]);
  const row = (k: "date" | "category" | "amount" | "paymentMethod" | "description" | "clientReference" | "orderNumber", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <>
      <ScreenModal onClose={onClose}>
        <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
          <h2 className="font-display text-xl font-bold text-foreground">{t("viewDetail")}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <dl className="space-y-1 font-body text-sm">
            {row("date", income.date)}{row("category", income.categoryLabel)}
            {row("amount", formatCurrency(income.amount))}
            {row("paymentMethod", income.paymentMethodLabel)}{row("description", income.description)}
            {row("clientReference", income.clientReference)}{row("orderNumber", income.orderNumber)}
          </dl>
          <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("income", income.id)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50"><FileDown className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("receiptPdf")}</button>
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {urls.map((src, i) => <img key={i} src={src} alt="" onClick={() => setPhoto(src)} className="h-24 w-24 cursor-pointer rounded object-cover" />)}
            </div>
          )}
        </div>
      </ScreenModal>
      {photo && <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />}
    </>
  );
}
