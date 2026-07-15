import { Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { Spinner } from "@shared/components/loading/Spinner";
import { useServicePage } from "@landing/application/useServicePages.hook";
import { useServicePageActions } from "@landing/application/useServicePageActions.hook";
import { supabaseServicePagesRepository } from "@landing/infrastructure/supabase-service-pages.repository";
import { Section } from "@landing/presentation/service-pages-admin/Section";
import { HeroEditor } from "@landing/presentation/service-pages-admin/HeroEditor";
import { UsesEditor } from "@landing/presentation/service-pages-admin/UsesEditor";
import { SpecsEditor } from "@landing/presentation/service-pages-admin/SpecsEditor";
import { FaqEditor } from "@landing/presentation/service-pages-admin/FaqEditor";
import { RequestFormEditor } from "@landing/presentation/service-pages-admin/RequestFormEditor";
import { SeoEditor } from "@landing/presentation/service-pages-admin/SeoEditor";

export function ServicePageEditorPage({ id }: { id: string }) {
  const { t } = useI18n(); const { can } = useModuleAccess(); const toast = useToast(); const nav = useNavigate();
  const { page, loading, setPage } = useServicePage(supabaseServicePagesRepository, id);
  const a = useServicePageActions(supabaseServicePagesRepository);
  if (!can("settings", "edit")) return <Navigate to="/dashboard" />;
  if (loading) return <div className="py-16"><Spinner /></div>;
  if (!page) return <div className="p-8 text-center text-muted-foreground">—</div>;
  const set = (patch: Partial<typeof page>) => setPage({ ...page, ...patch });
  const nFields = (Array.isArray(page.requestForm.fields) ? page.requestForm.fields : []).length;
  async function onSave() { const r = await a.save(id, page!); if (r.ok) toast.success(t("saved")); else toast.error(t("spErr")); }
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background/80 py-2 backdrop-blur">
        <button type="button" onClick={() => void nav({ to: "/settings/landing/service-pages" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />{t("landingServicePages")}</button>
        <div className="flex gap-2">
          <a href={`/servicios/${page.slug}?preview=true&pid=${id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground"><ExternalLink className="h-4 w-4" />{t("spPreview")}</a>
          <button type="button" disabled={a.busy} onClick={() => void onSave()} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
        </div>
      </div>
      <h1 className="font-display text-xl font-bold text-foreground">{(page.hero.title_es as string) || page.slug}</h1>
      <div className="space-y-3">
        <Section title={t("spSecHero")}><HeroEditor hero={page.hero} onChange={(hero) => set({ hero })} /></Section>
        <Section title={t("spSecUses")} count={page.uses.length}><UsesEditor uses={page.uses} onChange={(uses) => set({ uses })} /></Section>
        <Section title={t("spSecSpecs")} count={page.specs.length}><SpecsEditor specs={page.specs} onChange={(specs) => set({ specs })} /></Section>
        <Section title={t("spSecFaq")} count={page.faq.length}><FaqEditor faq={page.faq} onChange={(faq) => set({ faq })} /></Section>
        <Section title={t("spSecForm")} count={nFields}><RequestFormEditor form={page.requestForm} onChange={(requestForm) => set({ requestForm })} /></Section>
        <Section title={t("spSecSeo")}><SeoEditor seo={page.seo} onChange={(seo) => set({ seo })} /></Section>
      </div>
    </div>
  );
}
