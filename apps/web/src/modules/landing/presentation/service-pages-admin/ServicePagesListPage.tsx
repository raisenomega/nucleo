import { useState } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useSession } from "@shared/providers/SessionProvider";
import { Spinner } from "@shared/components/loading/Spinner";
import { EmptyState } from "@shared/components/loading/EmptyState";
import { isReady, isLoading } from "@shared/types/fetch-state.types";
import { useServicePages } from "@landing/application/useServicePages.hook";
import { useServicePageActions } from "@landing/application/useServicePageActions.hook";
import { supabaseServicePagesRepository } from "@landing/infrastructure/supabase-service-pages.repository";
import { ServicePageRow } from "@landing/presentation/service-pages-admin/ServicePageRow";
import { ServicePageCreateModal } from "@landing/presentation/service-pages-admin/ServicePageCreateModal";
import type { SpResult } from "@landing/domain/service-page-admin.types";

export function ServicePagesListPage() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast(); const nav = useNavigate();
  const { session } = useSession();
  const { state, reload } = useServicePages(supabaseServicePagesRepository);
  const a = useServicePageActions(supabaseServicePagesRepository);
  const [creating, setCreating] = useState(false); const [q, setQ] = useState("");
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  const tid = session?.tenantId ?? "";
  const open = (id: string) => void nav({ to: "/settings/landing/service-pages/$id", params: { id } });
  async function onCreate(slug: string, es: string, en: string, sub: string) {
    const r = await a.create(tid, slug, es, en, sub); if (r.ok && r.id) { setCreating(false); open(r.id); } else toast.error(t("spErr"));
  }
  async function onAction(p: Promise<SpResult>) { const r = await p; if (r.ok) { toast.success(t("saved")); reload(); } else toast.error(t("spErr")); }
  const rows = isReady(state) ? state.data.filter((p) => `${p.slug} ${String(p.hero.title_es ?? "")}`.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground md:text-2xl"><Layers className="mr-2 inline h-6 w-6" />{t("landingServicePages")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("spCreate")}</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full rounded-lg border border-border bg-background p-2 text-sm md:max-w-sm" />
      {isLoading(state) && <div className="py-16"><Spinner /></div>}
      {isReady(state) && rows.length === 0 && <EmptyState title={t("spEmptyTitle")} description={t("spEmptyDesc")} />}
      <div className="space-y-2">
        {rows.map((p) => <ServicePageRow key={p.id} page={p} onEdit={() => open(p.id)}
          onDuplicate={() => void onAction(a.duplicate(tid, p.id))} onToggle={() => void onAction(a.toggleActive(p.id, !p.isActive))} onDelete={() => void onAction(a.remove(p.id))} />)}
      </div>
      {creating && <ServicePageCreateModal onCreate={onCreate} onClose={() => setCreating(false)} />}
    </div>
  );
}
