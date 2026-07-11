import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { TaxPanel } from "@finance/domain/reconciliation.types";

export function ReconciliationTaxPanel({ tax }: { tax: TaxPanel }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-body font-bold text-foreground">
        <span>{t("taxObligations")}</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">{formatCurrency(tax.totalEstimated)}
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
      </button>
      {open && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                <th className="py-1">{t("obligation")}</th><th>{t("base")}</th><th className="text-right">{t("estimated")}</th>
              </tr></thead>
              <tbody>
                {tax.obligations.map((o) => (
                  <tr key={o.label} className="border-t border-border">
                    <td className="py-1"><div>{o.label}</div><div className="text-xs text-muted-foreground">{t(o.frequency as "monthly")}</div></td>
                    <td>{formatCurrency(o.base)}</td>
                    <td className="text-right font-semibold">{formatCurrency(o.estimated)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t border-border font-bold">
                <td className="py-2">{t("total")}</td><td></td>
                <td className="text-right text-primary">{formatCurrency(tax.totalEstimated)}</td>
              </tr></tfoot>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">⚠️ {t("consultCpa")}</p>
        </>
      )}
    </div>
  );
}
