import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import type { Income } from "@finance/domain/income.types";

export function IncomeDetail({ income, onClose }: { income: Income; onClose: () => void }) {
  const { t } = useI18n();
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
          <h2 className="font-display text-xl font-bold text-primary">{t("viewDetail")}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <dl className="space-y-1 font-body text-sm">
            {row("date", income.date)}{row("category", income.categoryLabel)}
            {row("amount", formatCurrency(income.amount))}
            {row("paymentMethod", income.paymentMethodLabel)}{row("description", income.description)}
            {row("clientReference", income.clientReference)}{row("orderNumber", income.orderNumber)}
          </dl>
          {urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {urls.map((src, i) => <img key={i} src={src} alt="" onClick={() => setPhoto(src)} className="h-24 w-24 cursor-pointer rounded object-cover" />)}
            </div>
          )}
        </div>
      </ScreenModal>
      {photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPhoto(null)}>
          <button type="button" onClick={() => setPhoto(null)} aria-label={t("cancel")} className="absolute right-4 top-4 text-white"><X className="h-6 w-6" /></button>
          <img src={photo} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}
