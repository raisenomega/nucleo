import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useBrand } from "@shared/providers/BrandProvider";
import { useToast } from "@shared/providers/toast-context";
import { useChartOfAccounts } from "@accounting/application/useChartOfAccounts.hook";
import { supabaseChartOfAccountsRepository } from "@accounting/infrastructure/supabase-chart-of-accounts.repository";
import { AccountTree } from "@accounting/presentation/AccountTree";
import { AccountFormModal } from "@accounting/presentation/AccountFormModal";
import { CategoryAccountMapping } from "@accounting/presentation/CategoryAccountMapping";
import type { ChartAccount, AccountFormData } from "@accounting/domain/chart-of-accounts.types";

export function ChartOfAccountsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const brand = useBrand();
  const toast = useToast();
  const coa = useChartOfAccounts(supabaseChartOfAccountsRepository);
  const [view, setView] = useState<"accounts" | "mapping">("accounts");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<ChartAccount | "new" | null>(null);
  const toggle = async (a: ChartAccount) => { const r = await coa.toggleActive(a.id, !a.active); if (!r.ok) toast.error(r.error); };
  const submit = (init?: ChartAccount) => (d: AccountFormData) => (init ? coa.update(init.id, d) : coa.create(d));
  const tab = (v: "accounts" | "mapping", label: string) => (
    <button type="button" onClick={() => setView(v)} className={`px-3 py-1.5 text-sm font-bold ${view === v ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{label}</button>
  );
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("accounting")}</h1>
      <div className="flex gap-2 border-b border-border">{tab("accounts", t("chartOfAccounts"))}{tab("mapping", t("categoryMapping"))}</div>
      {view === "accounts" ? <>
        <div className="flex items-center justify-end gap-3">
          <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />{t("inactiveAccounts")}</label>
          {can("accounting", "create") && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("createAccount")}</button>}
        </div>
        {coa.loading ? <p className="text-sm text-muted-foreground">…</p>
          : <AccountTree nodes={coa.tree} showInactive={showInactive} canEdit={can("accounting", "edit")} onEdit={setEditing} onToggle={toggle} />}
      </> : <CategoryAccountMapping accounts={coa.accounts} tenantId={brand.tenantId ?? ""} canEdit={can("accounting", "edit")} />}
      {editing && <AccountFormModal initial={editing === "new" ? undefined : editing} headers={coa.headers}
        onSubmit={submit(editing === "new" ? undefined : editing)} onClose={() => setEditing(null)} />}
    </div>
  );
}
