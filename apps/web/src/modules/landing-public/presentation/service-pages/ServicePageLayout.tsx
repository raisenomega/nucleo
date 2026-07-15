import { useI18n } from "@shared/i18n";
import { Spinner } from "@shared/components/loading/Spinner";
import { useServicePage } from "@landing-public/presentation/service-pages/useServicePage.hook";
import { useServicePageSeo } from "@landing-public/presentation/service-pages/useServicePageSeo.hook";
import { ServicePageBackNav } from "@landing-public/presentation/service-pages/ServicePageBackNav";
import { ServicePageNotFound } from "@landing-public/presentation/service-pages/ServicePageNotFound";
import { ServicePagePreviewBanner } from "@landing-public/presentation/service-pages/ServicePagePreviewBanner";
import { ServicePageHero } from "@landing-public/presentation/service-pages/ServicePageHero";
import { ServiceUsesGrid } from "@landing-public/presentation/service-pages/ServiceUsesGrid";
import { ServiceSpecsBar } from "@landing-public/presentation/service-pages/ServiceSpecsBar";
import { ServiceFaqAccordion } from "@landing-public/presentation/service-pages/ServiceFaqAccordion";
import { ServiceRequestForm } from "@landing-public/presentation/service-pages/ServiceRequestForm";

// Página dedicada de servicio: hero + usos + specs + FAQ (JSON-LD) + form request → lead.
export function ServicePageLayout({ slug, previewId }: { slug: string; previewId?: string }) {
  const { locale } = useI18n();
  const { page, status, isActive } = useServicePage(slug, previewId);
  useServicePageSeo(page, locale === "en");
  if (status === "loading") return <div className="min-h-screen py-16"><Spinner /></div>;
  if (status === "notfound" || !page) return <ServicePageNotFound />;
  return (
    <main className="lp-root min-h-screen bg-background text-foreground">
      {previewId && <ServicePagePreviewBanner active={isActive} />}
      <ServicePageBackNav />
      <ServicePageHero hero={page.hero} />
      <ServiceUsesGrid uses={page.uses} />
      <ServiceSpecsBar specs={page.specs} />
      <ServiceFaqAccordion faq={page.faq} />
      <ServiceRequestForm slug={slug} form={page.requestForm} />
    </main>
  );
}
