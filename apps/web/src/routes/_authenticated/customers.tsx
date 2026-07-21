import { useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { Plus } from "lucide-react";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { useToast } from "@shared/providers/toast-context";
import { useCustomersCrm } from "@shared/customers/useCustomersCrm.hook";
import { CustomersKpis } from "@shared/customers/CustomersKpis";
import { CustomersTable } from "@shared/customers/CustomersTable";
import { CustomerDetail } from "@shared/customers/CustomerDetail";
import { CustomerFormDialog } from "@shared/customers/CustomerFormDialog";
import type { AdminCustomer } from "@shared/customers/customers-agg";
import type { CustomerPayload } from "@shared/customers/customer-crm.repository";

export const Route = createFileRoute("/_authenticated/customers")({ component: CustomersPage });
const FILTERS = ["all", "active", "inactive", "debt"] as const;
const LABEL: Record<(typeof FILTERS)[number], TranslationKey> = { all: "filterAll", active: "cActiveSt", inactive: "cInactiveSt", debt: "cWithDebt" };

function CustomersPage() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const { session } = useSession(); const toast = useToast();
  const crm = useCustomersCrm(session?.tenantId ?? "");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState(""); const [viewing, setViewing] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCustomer | null | undefined>(undefined); // undefined=cerrado · null=nuevo
  const save = async (id: string | undefined, p: CustomerPayload) => {
    const e = id ? await crm.update(id, p) : await crm.create(p);
    if (e) return toast.error(e); setEditing(undefined); toast.success(t("saved"));
  };
  const shown = useMemo(() => crm.rows.filter((c) => {
    const f = filter === "all" || (filter === "active" && c.isActive) || (filter === "inactive" && !c.isActive) || (filter === "debt" && c.debt > 0);
    const q = search.trim().toLowerCase();
    return f && (!q || `${c.fullName} ${c.email} ${c.phone}`.toLowerCase().includes(q));
  }), [crm.rows, filter, search]);
  const view = crm.rows.find((c) => c.id === viewing);
  if (!can("customers", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("portal")}</h1>
        {can("customers", "create") && <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Nuevo cliente</button>}
      </div>
      <CustomersKpis kpis={crm.kpis} />
      {crm.rows.length === 0
        ? <div className="rounded-lg border border-border bg-card p-8 text-center"><p className="font-bold text-foreground">{t("cNoCustomers")}</p><p className="text-sm text-muted-foreground">{t("cRegisterHint")}</p></div>
        : <>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{t(LABEL[f])}</button>)}
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="ml-auto rounded-lg border border-border bg-background p-2 text-sm" />
          </div>
          <CustomersTable rows={shown} onView={setViewing} onEdit={can("customers", "edit") ? setEditing : undefined} />
        </>}
      {view && <CustomerDetail c={view} tenantId={session?.tenantId ?? ""} onClose={() => setViewing(null)} onChanged={crm.refresh} />}
      {editing !== undefined && <CustomerFormDialog initial={editing} onClose={() => setEditing(undefined)} onSave={save} />}
    </div>
  );
}
