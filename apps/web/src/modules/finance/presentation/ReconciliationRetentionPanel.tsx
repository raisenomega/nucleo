import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { RetentionPanel, RetentionDeposit } from "@finance/domain/reconciliation.types";

export function ReconciliationRetentionPanel({ retention, deposits, onRegister }: {
  retention: RetentionPanel; deposits: readonly RetentionDeposit[]; onRegister: () => void;
}) {
  const { t } = useI18n();
  const pct = retention.required > 0 ? Math.min(100, (retention.deposited / retention.required) * 100) : 0;
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-body font-bold text-primary">{t("retentionFund")} · {retention.retentionPct}%</h2>
        <button type="button" onClick={onRegister} className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold"><Plus className="h-4 w-4" /> {t("registerDeposit")}</button>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("required")}: <b className="text-primary">{formatCurrency(retention.required)}</b></span>
        <span>{t("deposited")}: <b>{formatCurrency(retention.deposited)}</b></span>
        <span>{t("pending")}: <b className="text-yellow-700">{formatCurrency(retention.pending)}</b></span>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold">{t("history")}</div>
        {deposits.length === 0 && <div className="text-xs text-muted-foreground">{t("noRecords")}</div>}
        <ul className="space-y-1 text-sm">
          {deposits.map((d) => (
            <li key={d.id} className="flex justify-between border-b border-border py-1">
              <span>{d.depositDate}{d.notes ? ` · ${d.notes}` : ""}</span><span className="font-semibold">{formatCurrency(d.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
