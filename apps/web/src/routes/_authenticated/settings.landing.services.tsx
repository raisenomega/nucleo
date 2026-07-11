import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { Pagination } from "@shared/components/Pagination";
import { useLandingServices } from "@landing/application/useLandingServices.hook";
import { useLandingCategories } from "@landing/application/useLandingCategories.hook";
import { supabaseLandingServicesRepository } from "@landing/infrastructure/supabase-landing-services.repository";
import { supabaseLandingCategoriesRepository } from "@landing/infrastructure/supabase-landing-categories.repository";
import { ServiceModal } from "@landing/presentation/ServiceModal";
import type { ServiceWithCategory, ServiceInput } from "@landing/domain/landing.types";

export const Route = createFileRoute("/_authenticated/settings/landing/services")({ component: Page });

function Page() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const m = useLandingServices(supabaseLandingServicesRepository);
  const cats = useLandingCategories(supabaseLandingCategoriesRepository);
  const [editing, setEditing] = useState<ServiceWithCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  async function del(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await m.remove(id); if (!r.ok) toast.error(r.error); } }
  async function onSave(input: ServiceInput) {
    const r = editing ? await m.update(editing.id, input) : await m.create(input);
    if (r.ok) { toast.success(t("saved")); setCreating(false); setEditing(null); } else toast.error(r.error);
  }
  const priceLbl = (s: ServiceWithCategory) => s.pricingType === "quote_required" ? t("ptQuoteRequired") : `${s.price ?? "—"}${s.priceUnit ? " / " + s.priceUnit : ""}`;
  const rows = m.list.slice((page - 1) * 12, page * 12);
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landing")} · {t("services")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("newService")}</button>
      </div>
      <div className="rounded-lg border border-border">
        {rows.map((s) => (
          <div key={s.id} onClick={() => setEditing(s)} className="flex cursor-pointer items-center gap-3 border-t border-border px-3 py-2 first:border-0 transition-colors hover:bg-secondary">
            {s.primaryImageUrl && <img src={s.primaryImageUrl} alt="" className="h-8 w-12 rounded object-cover" />}
            <span className="flex-1 font-semibold">{s.name}{!s.isActive && <span className="ml-2 text-xs text-destructive">●</span>}</span>
            <span className="text-xs text-muted-foreground">{s.categoryName ?? "—"}</span>
            <span className="text-sm font-bold text-foreground">{priceLbl(s)}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); void del(s.id); }} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
          </div>))}
        {m.list.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("noRecords")}</p>}
      </div>
      <Pagination total={m.list.length} page={page} onPageChange={setPage} />
      {(creating || editing) && <ServiceModal initial={editing ?? undefined} categories={cats.list} onSave={onSave} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
