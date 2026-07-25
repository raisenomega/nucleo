import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useToast } from "@shared/providers/toast-context";
import { accountingActionsRepository as repo } from "@accounting/infrastructure/supabase-accounting-actions.repository";
import type { ChartAccount } from "@accounting/domain/chart-of-accounts.types";

type Row = { code: string; debit: string; credit: string };
const EMPTY: Row = { code: "", debit: "", credit: "" };

// Asiento de apertura (source_type='opening', único por tenant). Solo cuentas de balance (activo/pasivo/capital).
export function OpeningEntryModal({ accounts, onSaved, onClose }: { accounts: readonly ChartAccount[]; onSaved: () => void; onClose: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY }, { ...EMPTY }]);
  const bal = accounts.filter((a) => !a.isHeader && a.active && ["asset", "liability", "equity"].includes(a.accountType));
  const num = (v: string) => Number(v) || 0;
  const upd = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const totDr = rows.reduce((s, r) => s + num(r.debit), 0), totCr = rows.reduce((s, r) => s + num(r.credit), 0);
  const diff = Math.round((totDr - totCr) * 100) / 100;
  const filled = rows.filter((r) => r.code);
  const valid = filled.length >= 2 && totDr > 0 && diff === 0 && filled.every((r) => (num(r.debit) > 0) !== (num(r.credit) > 0));
  async function save() {
    const res = await repo.createOpeningEntry(filled.map((r) => ({ account_code: r.code, debit: num(r.debit), credit: num(r.credit) })));
    if (res.ok) { toast.success(t("openingEntry")); onSaved(); onClose(); } else toast.error(res.error);
  }
  const inp = "rounded border border-border bg-background p-1 text-xs";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("createOpeningEntry")}</h2>
        <p className="text-xs text-muted-foreground">{t("initialBalances")}</p>
        <table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground">
          <th className="font-bold">{t("account")}</th><th className="font-bold">{t("debit")}</th><th className="font-bold">{t("credit")}</th><th /></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i}>
              <td className="pr-1"><select value={r.code} onChange={(e) => upd(i, { code: e.target.value })} className={`${inp} w-full`}><option value="">—</option>{bal.map((a) => <option key={a.id} value={a.accountCode}>{a.accountCode} · {a.accountName}</option>)}</select></td>
              <td className="pr-1"><input inputMode="decimal" value={r.debit} onChange={(e) => upd(i, { debit: e.target.value, credit: "" })} className={`${inp} w-20`} /></td>
              <td className="pr-1"><input inputMode="decimal" value={r.credit} onChange={(e) => upd(i, { credit: e.target.value, debit: "" })} className={`${inp} w-20`} /></td>
              <td>{rows.length > 2 && <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={t("removeLine")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}</td>
            </tr>))}</tbody>
        </table>
        <button type="button" onClick={() => setRows((rs) => [...rs, { ...EMPTY }])} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3.5 w-3.5" />{t("addLine")}</button>
        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-sm">
          <span className="text-muted-foreground">{t("totals")}: Dr {formatCurrency(totDr)} · Cr {formatCurrency(totCr)}</span>
          <span className={diff === 0 && totDr > 0 ? "font-bold text-green-600" : "font-bold text-destructive"}>{diff === 0 ? "✓ " + t("balanced") : "Δ " + formatCurrency(diff)}</span>
        </div>
        {diff !== 0 && <p className="text-xs text-destructive">{t("entryMustBalance")}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancelBtn")}</button>
          <button type="button" disabled={!valid} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("saveBtn")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
