import { CheckCircle2, AlertTriangle, Wand2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useCategoryMappings } from "@accounting/application/useCategoryMappings.hook";
import { supabaseCategoryMappingRepository } from "@accounting/infrastructure/supabase-category-mapping.repository";
import type { ChartAccount } from "@accounting/domain/chart-of-accounts.types";
import type { CategoryMapping } from "@accounting/domain/category-mapping.types";

// Mapeo categoría→cuenta contable (CEO). Manual (account_id) o heurístico (auto). UPDATE directo.
export function CategoryAccountMapping({ accounts, tenantId, canEdit }: { accounts: readonly ChartAccount[]; tenantId: string; canEdit: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const cm = useCategoryMappings(supabaseCategoryMappingRepository);
  const total = cm.mappings.length, mapped = cm.mappings.filter((m) => m.isManual).length;
  const opts = (kind: string) => accounts.filter((a) => !a.isHeader && a.active && (kind === "expense" ? a.accountType === "expense" || a.accountType === "cogs" : a.accountType === "revenue"));
  const set = async (id: string, v: string) => { const r = await cm.setAccount(id, v || null); if (!r.ok) toast.error(r.error); };
  const auto = async () => { const r = await cm.autoMap(tenantId); if (r.ok) toast.success(`${r.value.mapped} ${t("catsMapped")}`); else toast.error(r.error); };
  const row = (m: CategoryMapping) => (
    <tr key={m.categoryId} className="border-t border-border text-sm">
      <td className="px-2 py-1">{m.label}{m.expenseClass && <span className="ml-1 text-[10px] text-muted-foreground">({m.expenseClass})</span>}</td>
      <td className="px-2 py-1">{m.isManual
        ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />{m.accountCode} {m.accountName}</span>
        : <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />{t("useAuto")}: {m.resolvedCode}</span>}</td>
      <td className="px-2 py-1 text-right">{canEdit && <select value={m.accountId ?? ""} onChange={(e) => void set(m.categoryId, e.target.value)} className="rounded border border-border bg-background p-1 text-xs">
        <option value="">{t("useAuto")}</option>{opts(m.kind).map((a) => <option key={a.id} value={a.id}>{a.accountCode} · {a.accountName}</option>)}</select>}</td>
    </tr>
  );
  const section = (kind: string, title: string) => { const rows = cm.mappings.filter((m) => m.kind === kind); if (!rows.length) return null;
    return <div className="space-y-1"><h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full"><tbody>{rows.map(row)}</tbody></table></div></div>; };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{mapped}/{total} {t("catsMapped")}
          {total > 0 && mapped === total && <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-600">{t("mappingComplete")}</span>}</span>
        {canEdit && <button type="button" onClick={() => void auto()} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold"><Wand2 className="h-4 w-4" />{t("autoMapAll")}</button>}
      </div>
      {section("expense", t("expenses"))}
      {section("income", t("income"))}
    </div>
  );
}
