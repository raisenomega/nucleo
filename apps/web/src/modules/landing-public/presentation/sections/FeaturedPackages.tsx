import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { PackageCard } from "@landing-public/presentation/cards/PackageCard";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

const GRID = "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3";
export function FeaturedPackages({ packages, onCardClick }: { packages: HomePackage[]; onCardClick: () => void }) {
  const { t } = useI18n();
  return (
    <section id="packages" className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpSectionPackages")}</h2>
      <StaggerChildren className={GRID}>
        {packages.map((p) => <FadeInUp key={p.id} stagger><PackageCard pkg={p} onClick={onCardClick} /></FadeInUp>)}
      </StaggerChildren>
    </section>
  );
}
