import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import type { Expense } from "@finance/domain/expense.types";

type Emp = { id: string; full_name: string };

export function ExpenseDetail({ expense, employees, onClose }: {
  expense: Expense; employees: Emp[]; onClose: () => void;
}) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { void signEvidence(expense.evidenceUrls).then(setUrls); }, [expense]);
  const paidByName = employees.find((e) => e.id === expense.paidBy)?.full_name ?? "—";
  const row = (k: "date" | "category" | "amount" | "paymentMethod" | "description" | "paidBy", v: string) => (
    <div><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <>
      <ScreenModal onClose={onClose}>
        <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
          <h2 className="font-display text-xl font-bold text-primary">{t("expenseDetail")}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <dl className="space-y-1 font-body text-sm">
            {row("date", expense.date)}{row("category", expense.categoryLabel)}
            {row("amount", formatCurrency(expense.amount))}
            {row("paymentMethod", expense.paymentMethodLabel)}{row("description", expense.description)}
            {row("paidBy", paidByName)}
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
