import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { FaqItem } from "@landing-public/presentation/faqs/FaqItem";
import type { HomeFaq } from "@landing-public/domain/landing-home.types";

// FAQs 2-col expandidas (SEO-friendly). Preview de máx. 4; si hay más, "Ver todas" → /preguntas-frecuentes.
export function FaqsPreview({ faqs }: { faqs: HomeFaq[] }) {
  const { t } = useI18n();
  return (
    <section aria-label={t("lpFaqsTitle")} className="mx-auto max-w-7xl px-6 py-12">
      <FadeInUp><h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpFaqsTitle")}</h2></FadeInUp>
      <StaggerChildren className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {faqs.slice(0, 4).map((f, i) => <FadeInUp key={i} stagger><FaqItem faq={f} /></FadeInUp>)}
      </StaggerChildren>
      {faqs.length > 4 && (
        <div className="mt-8 text-center">
          <Link to="/preguntas-frecuentes" className="inline-flex items-center rounded-full border border-[color:var(--glass-border)] px-5 py-2 text-sm font-bold text-primary transition hover:bg-primary/10">{t("lpFaqsSeeAll")}</Link>
        </div>
      )}
    </section>
  );
}
