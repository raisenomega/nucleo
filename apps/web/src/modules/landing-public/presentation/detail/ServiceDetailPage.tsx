import { useI18n } from "@shared/i18n";
import { isReady, isLoading } from "@shared/types/fetch-state.types";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { useLandingService } from "@landing-public/presentation/useLandingService.hook";
import { useDetailSeo } from "@landing-public/presentation/detail/useDetailSeo.hook";
import { DetailShell } from "@landing-public/presentation/detail/DetailShell";
import { DetailHeader } from "@landing-public/presentation/detail/DetailHeader";
import { PublicImageGallery } from "@landing-public/presentation/detail/PublicImageGallery";
import { ServiceInfo } from "@landing-public/presentation/detail/ServiceInfo";
import { RelatedServices } from "@landing-public/presentation/detail/RelatedServices";
import { DetailNotFound } from "@landing-public/presentation/detail/DetailNotFound";
import { DetailSkeleton } from "@landing-public/presentation/detail/DetailSkeleton";
import { ContactSection } from "@landing-public/presentation/sections/ContactSection";
import { PublicFooter } from "@landing-public/presentation/footer/PublicFooter";

export function ServiceDetailPage({ slug }: { slug: string }) {
  const { t } = useI18n();
  const s = usePublicBrand();
  const state = useLandingService(slug);
  const sd = isReady(state) ? state.data.service : undefined;
  useDetailSeo(sd && (sd.meta_title || sd.name), sd && (sd.meta_description || sd.short_description || ""), sd?.primary_image_url);
  if (s.status === "loading") return <div className="min-h-screen bg-background" />;
  if (s.status === "fallback") return <DetailNotFound titleKey="lpDetailNotFoundService" />;
  if (isLoading(state)) return <DetailShell brand={s.brand}><DetailSkeleton /></DetailShell>;
  if (!isReady(state)) return <DetailShell brand={s.brand}><DetailNotFound titleKey="lpDetailNotFoundService" /></DetailShell>;
  const sv = state.data.service;
  const onQuote = () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  return (
    <DetailShell brand={s.brand}>
      <DetailHeader name={sv.name} sectionLabel={t("lpDetailBreadcrumbServices")} sectionHash="services" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
        <PublicImageGallery primaryUrl={sv.primary_image_url} gallery={[]} alt={sv.name} />
        <ServiceInfo service={sv} onQuote={onQuote} />
      </div>
      {state.data.related.length > 0 && <RelatedServices services={state.data.related} />}
      <ContactSection preselectedItem={{ kind: "service", id: sv.id, name: sv.name, slug: sv.slug }} />
      <PublicFooter brand={s.brand} tagline={sv.meta_description ?? ""} />
    </DetailShell>
  );
}
