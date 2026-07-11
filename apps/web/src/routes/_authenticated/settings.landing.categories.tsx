import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useLandingCategories } from "@landing/application/useLandingCategories.hook";
import { supabaseLandingCategoriesRepository } from "@landing/infrastructure/supabase-landing-categories.repository";
import { CategoryModal } from "@landing/presentation/CategoryModal";
import type { LandingCategory, CategoryInput } from "@landing/domain/landing.types";

export const Route = createFileRoute("/_authenticated/settings/landing/categories")({ component: Page });

const typeKey = (t: LandingCategory["categoryType"]) => (t === "product" ? "catProduct" : t === "service" ? "catService" : "catBoth");

function Page() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const m = useLandingCategories(supabaseLandingCategoriesRepository);
  const [editing, setEditing] = useState<LandingCategory | null>(null);
  const [creating, setCreating] = useState(false);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  async function del(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await m.remove(id); if (!r.ok) toast.error(r.error); } }
  async function onSave(input: CategoryInput) {
    const r = editing ? await m.update(editing.id, input) : await m.create(input);
    if (r.ok) { toast.success(t("saved")); setCreating(false); setEditing(null); } else toast.error(r.error);
  }
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("landing")} · {t("landingCategories")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("newCategory")}</button>
      </div>
      <div className="rounded-lg border border-border">
        {m.list.map((c) => (
          <div key={c.id} onClick={() => setEditing(c)} className="flex cursor-pointer items-center justify-between border-t border-border px-3 py-2 first:border-0 transition-colors hover:bg-secondary">
            <span className="font-semibold">{c.name}{!c.isActive && <span className="ml-2 text-xs text-destructive">●</span>}</span>
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">{c.slug}</span>
              <span className="rounded bg-secondary px-2 py-0.5">{t(typeKey(c.categoryType))}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); void del(c.id); }} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
            </span>
          </div>
        ))}
        {m.list.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("noRecords")}</p>}
      </div>
      {(creating || editing) && <CategoryModal initial={editing ?? undefined} onSave={onSave} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
