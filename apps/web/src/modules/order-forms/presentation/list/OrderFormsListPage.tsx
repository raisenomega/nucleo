import { useState } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { FileInput } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useSession } from "@shared/providers/SessionProvider";
import { Spinner } from "@shared/components/loading/Spinner";
import { EmptyState } from "@shared/components/loading/EmptyState";
import { isReady, isLoading } from "@shared/types/fetch-state.types";
import { useOrderForms } from "@order-forms/application/useOrderForms.hook";
import { useOrderFormActions } from "@order-forms/application/useOrderFormActions.hook";
import { supabaseOrderFormsRepository } from "@order-forms/infrastructure/supabase-order-forms.repository";
import { OrderFormRow } from "@order-forms/presentation/list/OrderFormRow";
import { OrderFormCreateModal } from "@order-forms/presentation/list/OrderFormCreateModal";

export function OrderFormsListPage() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast(); const nav = useNavigate();
  const { session } = useSession();
  const { state, reload } = useOrderForms(supabaseOrderFormsRepository);
  const a = useOrderFormActions(supabaseOrderFormsRepository);
  const [creating, setCreating] = useState(false); const [q, setQ] = useState("");
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  const open = (id: string) => void nav({ to: "/settings/landing/order-forms/$formId", params: { formId: id } });
  const tid = session?.tenantId ?? "";
  async function doCreate(name: string, desc: string) { const id = await a.create(tid, name, desc); if (id) open(id); else toast.error(t("ofErr")); }
  async function doDup(id: string) { const nid = await a.duplicate(tid, id); if (nid) { toast.success(t("saved")); open(nid); } }
  async function doDel(id: string) { if (window.confirm(t("ofDeleteConfirm"))) { const r = await a.remove(id); r.ok ? (toast.success(t("saved")), reload()) : toast.error(r.error); } }
  async function doDef(id: string) { const r = await a.setDefault(id); r.ok ? (toast.success(t("saved")), reload()) : toast.error(r.error); }
  const forms = isReady(state) ? state.data.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landingOrderForms")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("ofCreate")}</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full rounded-lg border border-border bg-background p-2 text-sm md:max-w-xs" />
      {isLoading(state) && <div className="py-12"><Spinner /></div>}
      {isReady(state) && (forms.length ? (
        <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>
            <th className="p-3 font-medium">{t("ofName")}</th><th className="p-3 font-medium">{t("ofFields")}</th><th className="p-3 font-medium">{t("ofCreatedAt")}</th><th className="p-3" /></tr></thead>
          <tbody>{forms.map((f) => <OrderFormRow key={f.id} form={f} onEdit={() => open(f.id)} onDuplicate={() => void doDup(f.id)} onDefault={() => void doDef(f.id)} onDelete={() => void doDel(f.id)} />)}</tbody>
        </table></div>
      ) : <EmptyState icon={FileInput} title={t("ofEmptyTitle")} description={t("ofEmptyDesc")} />)}
      {creating && <OrderFormCreateModal busy={a.busy} onCreate={(n, d) => void doCreate(n, d)} onClose={() => setCreating(false)} />}
    </div>
  );
}
