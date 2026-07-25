import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useToast } from "@shared/providers/toast-context";
import { accountingActionsRepository as repo } from "@accounting/infrastructure/supabase-accounting-actions.repository";
import type { ChartAccount } from "@accounting/domain/chart-of-accounts.types";

type Line = { accountId: string; debit: string; credit: string; description: string };
const EMPTY: Line = { accountId: "", debit: "", credit: "", description: "" };

// Alta de asiento manual (entry_type='manual', status='draft'). Cuadre en vivo; guardar deshabilitado si no cuadra.
export function ManualEntryModal({ accounts, onSaved, onClose }: { accounts: readonly ChartAccount[]; onSaved: () => void; onClose: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY }, { ...EMPTY }]);
  const leaf = accounts.filter((a) => !a.isHeader && a.active);
  const num = (v: string) => Number(v) || 0;
  const upd = (i: number, p: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const totDr = lines.reduce((s, l) => s + num(l.debit), 0), totCr = lines.reduce((s, l) => s + num(l.credit), 0);
  const diff = Math.round((totDr - totCr) * 100) / 100;
  const filled = lines.filter((l) => l.accountId);
  const valid = desc.trim() !== "" && filled.length >= 2 && totDr > 0 && diff === 0 && filled.every((l) => (num(l.debit) > 0) !== (num(l.credit) > 0));
  async function save() {
    const payload = filled.map((l) => ({ account_id: l.accountId, debit: num(l.debit), credit: num(l.credit), description: l.description || null }));
    const r = await repo.createManualEntry(date, desc.trim(), payload);
    if (r.ok) { toast.success(t("draftEntry")); onSaved(); onClose(); } else toast.error(r.error);
  }
  const inp = "rounded border border-border bg-background p-1 text-xs";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("createManualEntry")}</h2>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("description")} className={`${inp} min-w-40 flex-1`} />
        </div>
        <table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground">
          <th className="font-bold">{t("account")}</th><th className="font-bold">{t("debit")}</th><th className="font-bold">{t("credit")}</th><th /></tr></thead>
          <tbody>{lines.map((l, i) => (
            <tr key={i}>
              <td className="pr-1"><select value={l.accountId} onChange={(e) => upd(i, { accountId: e.target.value })} className={`${inp} w-full`}><option value="">—</option>{leaf.map((a) => <option key={a.id} value={a.id}>{a.accountCode} · {a.accountName}</option>)}</select></td>
              <td className="pr-1"><input inputMode="decimal" value={l.debit} onChange={(e) => upd(i, { debit: e.target.value, credit: "" })} className={`${inp} w-20`} /></td>
              <td className="pr-1"><input inputMode="decimal" value={l.credit} onChange={(e) => upd(i, { credit: e.target.value, debit: "" })} className={`${inp} w-20`} /></td>
              <td>{lines.length > 2 && <button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label={t("removeLine")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}</td>
            </tr>))}</tbody>
        </table>
        <button type="button" onClick={() => setLines((ls) => [...ls, { ...EMPTY }])} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3.5 w-3.5" />{t("addLine")}</button>
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
