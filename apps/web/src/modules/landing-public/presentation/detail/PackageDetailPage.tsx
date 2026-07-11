import { useI18n } from "@shared/i18n";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { useLandingPackage } from "@landing-public/presentation/useLandingPackage.hook";
import { useDetailSeo } from "@landing-public/presentation/detail/useDetailSeo.hook";
import { DetailShell } from "@landing-public/presentation/detail/DetailShell";
import { DetailHeader } from "@landing-public/presentation/detail/DetailHeader";
import { PublicImageGallery } from "@landing-public/presentation/detail/PublicImageGallery";
import { PackageBadge } from "@landing-public/presentation/detail/PackageBadge";
import { PackageInfo } from "@landing-public/presentation/detail/PackageInfo";
import { PackageIncludes } from "@landing-public/presentation/detail/PackageIncludes";
import { RelatedPackages } from "@landing-public/presentation/detail/RelatedPackages";
import { DetailNotFound } from "@landing-public/presentation/detail/DetailNotFound";
import { DetailSkeleton } from "@landing-public/presentation/detail/DetailSkeleton";
import { ContactSection } from "@landing-public/presentation/sections/ContactSection";
import { PublicFooter } from "@landing-public/presentation/footer/PublicFooter";

export function PackageDetailPage({ slug }: { slug: string }) {
  const { t } = useI18n();
  const s = usePublicBrand();
  const { data, status } = useLandingPackage(slug);
  const pk = data?.pkg;
  useDetailSeo(pk && (pk.meta_title || pk.name), pk && (pk.meta_description || pk.short_description || ""), pk?.primary_image_url);
  if (s.status === "loading") return <div className="min-h-screen bg-background" />;
  if (s.status === "fallback") return <DetailNotFound titleKey="lpDetailNotFoundPackage" />;
  if (status === "loading") return <DetailShell brand={s.brand}><DetailSkeleton /></DetailShell>;
  if (status !== "ready" || !data) return <DetailShell brand={s.brand}><DetailNotFound titleKey="lpDetailNotFoundPackage" /></DetailShell>;
  const p = data.pkg;
  const onQuote = () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  return (
    <DetailShell brand={s.brand}>
      <DetailHeader name={p.name} sectionLabel={t("lpDetailBreadcrumbPackages")} sectionHash="packages" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
        <div className="relative">{p.badge_label && <PackageBadge label={p.badge_label} />}<PublicImageGallery primaryUrl={p.primary_image_url} gallery={[]} alt={p.name} /></div>
        <PackageInfo pkg={p} onQuote={onQuote} />
      </div>
      <PackageIncludes pkg={p} />
      {data.related.length > 0 && <RelatedPackages packages={data.related} />}
      <ContactSection preselectedItem={{ kind: "package", id: p.id, name: p.name, slug: p.slug }} />
      <PublicFooter brand={s.brand} tagline={p.meta_description ?? ""} />
    </DetailShell>
  );
}
