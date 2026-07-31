import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useLandingOffers } from "@landing/application/useLandingOffers.hook";
import { supabaseLandingOffersRepository } from "@landing/infrastructure/supabase-landing-offers.repository";
import { OfferModal } from "@landing/presentation/offers/OfferModal";
import type { Offer, OfferInput } from "@landing/domain/landing-offer.types";

export const Route = createFileRoute("/_authenticated/settings/landing/ofertas")({ component: Page });

function Page() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const m = useLandingOffers(supabaseLandingOffersRepository);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [creating, setCreating] = useState(false);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  async function del(id: string) { if (window.confirm(t("confirmDelete"))) { const r = await m.remove(id); if (!r.ok) toast.error(r.error); } }
  async function onSave(input: OfferInput) {
    const r = editing ? await m.update(editing.id, input) : await m.create(input);
    if (r.ok) { toast.success(t("saved")); setCreating(false); setEditing(null); } else toast.error(r.error);
  }
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landing")} · {t("landingOffers")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("landingOffersNew")}</button>
      </div>
      <p className="text-xs text-muted-foreground">{t("landingOffersHint")}</p>
      <div className="rounded-lg border border-border">
        {m.list.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t("landingOffersEmpty")}</p>}
        {m.list.map((o) => (
          <div key={o.id} onClick={() => setEditing(o)} className="flex cursor-pointer items-center justify-between border-t border-border px-3 py-2 first:border-0 transition-colors hover:bg-secondary">
            <span className="font-semibold">{o.titleEs || o.badgeTextEs}{!o.isActive && <span className="ml-2 text-xs text-destructive">● inactiva</span>}</span>
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>${o.hookPrice.toFixed(2)} · {o.commitmentCycles} ciclos · {o.applicableServices.length} serv.</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); void del(o.id); }} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
            </span>
          </div>
        ))}
      </div>
      {(creating || editing) && <OfferModal initial={editing ?? undefined} onSave={onSave} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
