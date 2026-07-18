import { X, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { EXTERNAL_TYPE_LABEL } from "@finance/presentation/ExternalWorkerForm";
import type { TranslationKey } from "@shared/i18n";
import type { ExternalWorker } from "@finance/domain/external-worker.types";
import type { Payroll } from "@finance/domain/payroll.types";

// Detalle de solo lectura de un trabajador externo: ficha completa + historial de pagos con recibo PDF por pago.
export function ExternalWorkerDetail({ worker, payments, onClose }: {
  worker: ExternalWorker; payments: readonly Payroll[]; onClose: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const pdf = usePdf();
  const money = can("payroll", "salary");
  const total = payments.reduce((s, p) => s + (p.grossSalary || p.amount), 0);
  const fields: [TranslationKey, string][] = [
    ["workerTypeLabel", t(EXTERNAL_TYPE_LABEL[worker.workerType])], ["phone", worker.phone], ["email", worker.email],
    ["address", worker.address], ["specialty", worker.specialty], ["department", worker.department], ["taxId", worker.taxId],
    ["hourlyRate", worker.hourlyRate != null ? formatCurrency(worker.hourlyRate) : ""],
    ["dailyRate", worker.dailyRate != null ? formatCurrency(worker.dailyRate) : ""],
  ];
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-foreground">{worker.fullName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 md:p-6">
        <dl className="space-y-1 font-body text-sm">
          {fields.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}><dt className="inline text-muted-foreground">{t(k)}: </dt><dd className="inline">{v}</dd></div>
          ))}
        </dl>
        <div className="space-y-1 border-t border-border pt-2 text-sm">
          <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>{t("externalPayments")}</span>{money && <span>{t("totalPaid")}: {formatCurrency(total)}</span>}</div>
          {payments.length === 0 && <p className="text-muted-foreground">{t("noRecords")}</p>}
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <span>{p.date} · {p.paymentMethodLabel}</span>
              <span className="flex items-center gap-2">{money && <span className="font-semibold">{formatCurrency(p.grossSalary || p.amount)}</span>}
                {money && <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("payroll", p.id)} aria-label={t("payslipPdf")} className="text-primary disabled:opacity-50"><FileDown className="h-4 w-4" /></button>}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenModal>
  );
}
