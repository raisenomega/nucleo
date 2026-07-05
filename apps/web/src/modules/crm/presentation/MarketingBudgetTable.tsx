import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { Budget } from "@crm/domain/marketing.types";

export function MarketingBudgetTable({ channels, budgets, month, canEdit, onSave }: {
  channels: readonly string[]; budgets: readonly Budget[]; month: string; canEdit: boolean;
  onSave: (channel: string, amount: number) => void;
}) {
  const { t } = useI18n();
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const c of channels) { const b = budgets.find((x) => x.channel === c); next[c] = b ? String(b.budgetedAmount) : ""; }
    setVals(next);
  }, [budgets, channels]);
  const total = channels.reduce((s, c) => s + Number(vals[c] || 0), 0);
  const th = "px-3 py-2 text-left font-bold";
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-body font-bold">{t("budgetList")} · {month}</h2>
        <span className="font-body font-bold text-primary">{t("total")}: {formatCurrency(total)}</span>
      </div>
      <table className="w-full font-body text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{t("channel")}</th><th className={th}>{t("budgetedAmount")}</th>{canEdit && <th className={th} />}
        </tr></thead>
        <tbody>
          {channels.map((c) => (
            <tr key={c} className="border-t border-border">
              <td className="px-3 py-2">{c}</td>
              <td className="px-3 py-2">
                <input type="number" step="0.01" min="0" disabled={!canEdit} value={vals[c] ?? ""}
                  onChange={(e) => setVals((p) => ({ ...p, [c]: e.target.value }))}
                  className="w-32 rounded border border-border bg-background p-1 disabled:opacity-50" />
              </td>
              {canEdit && (
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onSave(c, Number(vals[c] || 0))}
                    className="rounded bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">{t("save")}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
