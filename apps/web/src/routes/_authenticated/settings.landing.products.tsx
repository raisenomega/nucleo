import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { Pagination } from "@shared/components/Pagination";
import { useLandingProducts } from "@landing/application/useLandingProducts.hook";
import { useLandingCategories } from "@landing/application/useLandingCategories.hook";
import { supabaseLandingProductsRepository } from "@landing/infrastructure/supabase-landing-products.repository";
import { supabaseLandingCategoriesRepository } from "@landing/infrastructure/supabase-landing-categories.repository";
import { ProductModal } from "@landing/presentation/ProductModal";
import type { ProductWithCategory, ProductInput } from "@landing/domain/landing.types";

export const Route = createFileRoute("/_authenticated/settings/landing/products")({ component: Page });

function Page() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const m = useLandingProducts(supabaseLandingProductsRepository);
  const cats = useLandingCategories(supabaseLandingCategoriesRepository);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  async function del(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await m.remove(id); if (!r.ok) toast.error(r.error); } }
  async function onSave(input: ProductInput) {
    const r = editing ? await m.update(editing.id, input) : await m.create(input);
    if (r.ok) { toast.success(t("saved")); setCreating(false); setEditing(null); } else toast.error(r.error);
  }
  const rows = m.list.slice((page - 1) * 12, page * 12);
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landing")} · {t("products")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("newProduct")}</button>
      </div>
      <div className="rounded-lg border border-border">
        {rows.map((p) => (
          <div key={p.id} onClick={() => setEditing(p)} className="flex cursor-pointer items-center gap-3 border-t border-border px-3 py-2 first:border-0 transition-colors hover:bg-secondary">
            {p.primaryImageUrl && <img src={p.primaryImageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
            <span className="flex-1 font-semibold">{p.name}{!p.isActive && <span className="ml-2 text-xs text-destructive">●</span>}</span>
            <span className="text-xs text-muted-foreground">{p.categoryName ?? "—"}</span>
            <span className="font-bold text-foreground">{p.currency} {p.price.toFixed(2)}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); void del(p.id); }} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
          </div>))}
        {m.list.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("noRecords")}</p>}
      </div>
      <Pagination total={m.list.length} page={page} onPageChange={setPage} />
      {(creating || editing) && <ProductModal initial={editing ?? undefined} categories={cats.list} onSave={onSave} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
