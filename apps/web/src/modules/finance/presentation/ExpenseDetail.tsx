import { useEffect, useState } from "react";
import { PhotoLightbox } from "@shared/components/PhotoLightbox";
import { X, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { usePdfBrand } from "@shared/hooks/usePdfBrand";
import { expenseReceiptDoc } from "@finance/presentation/pdf/finance-pdf-docs";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { EntryReconciliationBadge } from "@finance/presentation/EntryReconciliationBadge";
import type { Expense } from "@finance/domain/expense.types";

type Emp = { id: string; full_name: string };

export function ExpenseDetail({ expense, employees, onClose }: {
  expense: Expense; employees: Emp[]; onClose: () => void;
}) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const brand = usePdfBrand();
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
          <h2 className="font-display text-xl font-bold text-foreground">{t("expenseDetail")}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <dl className="space-y-1 font-body text-sm">
            {row("date", expense.date)}{row("category", expense.categoryLabel)}
            {row("amount", formatCurrency(expense.amount))}
            {row("paymentMethod", expense.paymentMethodLabel)}{row("description", expense.description)}
            {row("paidBy", paidByName)}
          </dl>
          <EntryReconciliationBadge entryType="expense" entryId={expense.id} />
          <button type="button" disabled={generating} onClick={() => void exportPdf(() => expenseReceiptDoc(expense, paidByName, brand, t))} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold disabled:opacity-50"><FileDown className="h-4 w-4" /> {generating ? t("generatingPdf") : t("receiptPdf")}</button>
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
