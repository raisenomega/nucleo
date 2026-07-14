import { CategoriesStrip } from "@landing-public/presentation/sections/CategoriesStrip";
import { FeaturedProducts } from "@landing-public/presentation/sections/FeaturedProducts";
import { FeaturedServices } from "@landing-public/presentation/sections/FeaturedServices";
import { FeaturedPackages } from "@landing-public/presentation/sections/FeaturedPackages";
import { TestimonialsBanner } from "@landing-public/presentation/testimonials/TestimonialsBanner";
import { FaqsPreview } from "@landing-public/presentation/sections/FaqsPreview";
import type { LandingHome } from "@landing-public/domain/landing-home.types";

// Bloques debajo del hero. Skip-empty: cada sección solo se renderiza si tiene items. El ancla #contact vive en
// ContactSection (PublicLandingRoot); la barra CTA verde (FinalCta) se eliminó y su lugar lo toma TestimonialsBanner.
export function HomeSections({ home }: { home: LandingHome | null }) {
  return (
    <>
      {home && home.categories.length > 0 && <CategoriesStrip categories={home.categories} />}
      {home && home.featured_products.length > 0 && <FeaturedProducts products={home.featured_products} />}
      {home && home.featured_services.length > 0 && <FeaturedServices services={home.featured_services} />}
      {home && home.featured_packages.length > 0 && <FeaturedPackages packages={home.featured_packages} />}
      {home && home.testimonials.length > 0 && <TestimonialsBanner testimonials={home.testimonials} />}
      {home && home.faqs_preview.length > 0 && <FaqsPreview faqs={home.faqs_preview} />}
    </>
  );
}
