import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { ServiceCard } from "@landing-public/presentation/cards/ServiceCard";
import type { HomeService } from "@landing-public/domain/landing-home.types";

const GRID = "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3";
export function FeaturedServices({ services, onCardClick }: { services: HomeService[]; onCardClick: () => void }) {
  const { t } = useI18n();
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpSectionServices")}</h2>
      <StaggerChildren className={GRID}>
        {services.map((s) => <FadeInUp key={s.id} stagger><ServiceCard service={s} onClick={onCardClick} /></FadeInUp>)}
      </StaggerChildren>
    </section>
  );
}
