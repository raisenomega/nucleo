import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { ServiceCard } from "@landing-public/presentation/cards/ServiceCard";
import type { HomeService } from "@landing-public/domain/landing-home.types";

export function RelatedServices({ services }: { services: HomeService[] }) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpDetailRelatedServicesTitle")}</h2>
      <StaggerChildren className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => <FadeInUp key={s.id} stagger><ServiceCard service={s} /></FadeInUp>)}
      </StaggerChildren>
    </section>
  );
}
