import { useI18n } from "@shared/i18n";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { useLandingProduct } from "@landing-public/presentation/useLandingProduct.hook";
import { useProductSeo } from "@landing-public/presentation/detail/useProductSeo.hook";
import { DetailShell } from "@landing-public/presentation/detail/DetailShell";
import { DetailHeader } from "@landing-public/presentation/detail/DetailHeader";
import { PublicImageGallery } from "@landing-public/presentation/detail/PublicImageGallery";
import { ProductInfo } from "@landing-public/presentation/detail/ProductInfo";
import { RelatedProducts } from "@landing-public/presentation/detail/RelatedProducts";
import { DetailNotFound } from "@landing-public/presentation/detail/DetailNotFound";
import { DetailSkeleton } from "@landing-public/presentation/detail/DetailSkeleton";
import { ContactSection } from "@landing-public/presentation/sections/ContactSection";
import { PublicFooter } from "@landing-public/presentation/footer/PublicFooter";

export function ProductDetailPage({ slug }: { slug: string }) {
  const { t } = useI18n();
  const s = usePublicBrand();
  const { data, status } = useLandingProduct(slug);
  useProductSeo(data?.product);
  if (s.status === "loading") return <div className="min-h-screen bg-background" />;
  if (s.status === "fallback") return <DetailNotFound />;
  if (status === "loading") return <DetailShell brand={s.brand}><DetailSkeleton /></DetailShell>;
  if (status !== "ready" || !data) return <DetailShell brand={s.brand}><DetailNotFound /></DetailShell>;
  const p = data.product;
  const onQuote = () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  return (
    <DetailShell brand={s.brand}>
      <DetailHeader name={p.name} sectionLabel={t("lpDetailBreadcrumbProducts")} sectionHash="products" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
        <PublicImageGallery primaryUrl={p.primary_image_url} gallery={p.gallery_images ?? []} alt={p.name} />
        <ProductInfo product={p} onQuote={onQuote} />
      </div>
      {data.related.length > 0 && <RelatedProducts products={data.related} />}
      <ContactSection preselectedItem={{ kind: "product", id: p.id, name: p.name, slug: p.slug }} />
      <PublicFooter brand={s.brand} tagline={p.meta_description ?? ""} />
    </DetailShell>
  );
}
