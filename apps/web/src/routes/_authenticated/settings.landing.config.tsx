import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useLandingConfig } from "@landing/application/useLandingConfig.hook";
import { supabaseLandingConfigRepository } from "@landing/infrastructure/supabase-landing-config.repository";
import { LandingConfigHeroSection } from "@landing/presentation/LandingConfigHeroSection";
import { LandingConfigMetaSection } from "@landing/presentation/LandingConfigMetaSection";
import { LandingConfigContactSection } from "@landing/presentation/LandingConfigContactSection";
import { LandingConfigSocialSchemaSection } from "@landing/presentation/LandingConfigSocialSchemaSection";
import type { LandingConfig } from "@landing/domain/landing.types";

export const Route = createFileRoute("/_authenticated/settings/landing/config")({ component: Page });

const EMPTY: LandingConfig = {
  heroTitle: "", heroSubtitle: "", heroCtaLabel: "", heroCtaType: "quote", heroCtaHref: "", heroImageUrl: null, heroVideoUrl: null,
  metaTitle: "", metaDescription: "", metaOgImageUrl: null, metaKeywords: [], publicPhone: "", publicWhatsapp: "", publicEmail: "", publicAddress: "",
  businessHours: null, socialFacebook: "", socialInstagram: "", socialYoutube: "", socialTiktok: "",
  schemaBusinessType: "LocalBusiness", schemaGeoLat: null, schemaGeoLng: null, schemaPriceRange: "$$",
};

function Page() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast();
  const m = useLandingConfig(supabaseLandingConfigRepository);
  const [draft, setDraft] = useState<LandingConfig>(EMPTY);
  const [open, setOpen] = useState("hero");
  useEffect(() => { if (m.config) setDraft(m.config); }, [m.config]);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  const set = (p: Partial<LandingConfig>) => setDraft((d) => ({ ...d, ...p }));
  async function save() { const r = await m.save(draft); if (r.ok) toast.success(t("saved")); else toast.error(r.error); }
  const secs = [
    { id: "hero", label: t("hero"), node: <LandingConfigHeroSection c={draft} set={set} /> },
    { id: "meta", label: t("metaSeo"), node: <LandingConfigMetaSection c={draft} set={set} /> },
    { id: "contact", label: t("contactSection"), node: <LandingConfigContactSection c={draft} set={set} /> },
    { id: "social", label: t("socialSection"), node: <LandingConfigSocialSchemaSection c={draft} set={set} /> },
  ];
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("landing")} · {t("landingConfig")}</h1>
      {secs.map((s) => (
        <div key={s.id} className="rounded-lg border border-border">
          <button type="button" onClick={() => setOpen(open === s.id ? "" : s.id)} className="flex w-full items-center justify-between p-3 font-bold">
            {s.label}<span>{open === s.id ? "–" : "+"}</span></button>
          {open === s.id && <div className="border-t border-border p-3">{s.node}</div>}
        </div>
      ))}
      <button type="button" disabled={m.saving} onClick={() => void save()}
        className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{m.saving ? t("sending") : t("save")}</button>
    </div>
  );
}
