import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import type { Payroll } from "@finance/domain/payroll.types";

export function PayrollDetail({ item, onClose }: { item: Payroll; onClose: () => void }) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(item.evidenceUrls).then(setUrls); }, [item]);
  const row = (k: "date" | "employee" | "period" | "amount" | "paymentMethod" | "notes", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="w-full max-w-lg space-y-3 rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-primary">{t("payrollDetail")}</h2>
            <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
          </div>
          <dl className="space-y-1 font-body text-sm">
            {row("date", item.date)}{row("employee", item.employeeName)}{row("period", item.period)}
            {row("amount", formatCurrency(item.amount))}{row("paymentMethod", item.paymentMethodLabel)}
            {row("notes", item.notes)}
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
