import { getSections } from "@raisen-marketing/infrastructure/marketing-sections.repository";
import { getMarketingHero } from "@raisen-marketing/infrastructure/marketing-hero.repository";
import { getFeaturesConfig, getFeatures } from "@raisen-marketing/infrastructure/marketing-features.repository";
import { getProcessConfig, getProcessSteps } from "@raisen-marketing/infrastructure/marketing-process.repository";
import { getSolutionsConfig, getSolutions } from "@raisen-marketing/infrastructure/marketing-solutions.repository";
import { getPricingConfig, getPricingTiers } from "@raisen-marketing/infrastructure/marketing-pricing.repository";
import { getAddons } from "@raisen-marketing/infrastructure/marketing-addons.repository";
import { getTestimonialsConfig, getTestimonials } from "@raisen-marketing/infrastructure/marketing-testimonials.repository";
import { getFaqConfig, getFaqs } from "@raisen-marketing/infrastructure/marketing-faq.repository";
import { getLeadFormConfig } from "@raisen-marketing/infrastructure/marketing-lead-form.repository";
import { getFooter } from "@raisen-marketing/infrastructure/marketing-footer.repository";
import { getSocialLinks } from "@raisen-marketing/infrastructure/marketing-social.repository";
import { getLegalLinks } from "@raisen-marketing/infrastructure/marketing-legal.repository";
import type { LandingData } from "@raisen-marketing/data/landing-data.types";

// Snapshot de la landing para el SSR. Reutiliza los MISMOS repositorios que usan los hooks en cliente, así
// no hay dos mapeos que mantener sincronizados. Las 17 consultas van en un solo Promise.all: son
// independientes, de modo que el coste es ~1 round-trip, no 17.
const TTL_MS = 5 * 60 * 1000;
let cache: { at: number; data: LandingData } | null = null;

export async function fetchLandingData(): Promise<LandingData | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const [
      sections, hero, featuresConfig, features, processConfig, processSteps,
      solutionsConfig, solutions, pricingConfig, tiers, addons,
      testimonialsConfig, testimonials, faqConfig, faqs, leadFormConfig,
      footer, socials, legalLinks,
    ] = await Promise.all([
      getSections(), getMarketingHero(), getFeaturesConfig(), getFeatures(true),
      getProcessConfig(), getProcessSteps(true), getSolutionsConfig(), getSolutions(true),
      getPricingConfig(), getPricingTiers(true), getAddons(true),
      getTestimonialsConfig(), getTestimonials(true), getFaqConfig(), getFaqs(true),
      getLeadFormConfig(), getFooter(), getSocialLinks(true), getLegalLinks(),
    ]);
    // Sin secciones no hay landing que sembrar: se devuelve null y los hooks caen a su fallback.
    if (!sections.length) return null;
    const data: LandingData = {
      sections, hero, featuresConfig, features, processConfig, processSteps,
      solutionsConfig, solutions, pricingConfig, tiers, addons,
      testimonialsConfig, testimonials, faqConfig, faqs, leadFormConfig,
      footer, socials, legalLinks,
    };
    cache = { at: Date.now(), data };
    return data;
  } catch { return null; }
}
