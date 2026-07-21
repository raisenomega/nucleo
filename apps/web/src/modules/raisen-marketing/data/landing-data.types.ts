import type { SectionRow } from "@raisen-marketing/data/section.types";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";
import type { MarketingFeatureRow, FeaturesConfig } from "@raisen-marketing/data/feature.types";
import type { ProcessStepRow, ProcessConfig } from "@raisen-marketing/data/process.types";
import type { SolutionRow, SolutionsConfig } from "@raisen-marketing/data/solution.types";
import type { PricingTierRow, PricingConfig, PricingAddonRow } from "@raisen-marketing/data/pricing.types";
import type { TestimonialRow, TestimonialsConfig } from "@raisen-marketing/data/testimonial.types";
import type { FaqRow, FaqConfig } from "@raisen-marketing/data/faq.types";
import type { LeadFormConfig } from "@raisen-marketing/data/lead-form.types";
import type { FooterRow, SocialLink } from "@raisen-marketing/data/footer.types";
import type { LegalLink } from "@raisen-marketing/data/legal.types";

// Snapshot COMPLETO de la landing resuelto en el servidor y serializado con el loaderData. Cada hook lo usa
// como estado inicial, así el HTML del SSR trae los datos reales de la DB en vez del fallback estático.
export interface LandingData {
  sections: SectionRow[];
  hero: MarketingHeroRow | null;
  featuresConfig: FeaturesConfig | null; features: MarketingFeatureRow[];
  processConfig: ProcessConfig | null; processSteps: ProcessStepRow[];
  solutionsConfig: SolutionsConfig | null; solutions: SolutionRow[];
  pricingConfig: PricingConfig | null; tiers: PricingTierRow[]; addons: PricingAddonRow[];
  testimonialsConfig: TestimonialsConfig | null; testimonials: TestimonialRow[];
  faqConfig: FaqConfig | null; faqs: FaqRow[];
  leadFormConfig: LeadFormConfig | null;
  footer: FooterRow | null; socials: SocialLink[]; legalLinks: LegalLink[];
}
