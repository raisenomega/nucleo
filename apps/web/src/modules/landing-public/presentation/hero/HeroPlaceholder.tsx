import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";

// Contenido del hero (placeholder): título = display_name del tenant + subtítulo i18n + CTA fake.
// Data real (config hero) llega en 3.E.3. Sin fetch: recibe displayName por prop.
export function HeroPlaceholder({ displayName }: { displayName: string }) {
  const { t } = useI18n();
  return (
    <FadeInUp delay={0.2}>
      <GlassCard elevation="xl" padding="lg" className="mx-auto max-w-2xl text-center">
        <h1 style={{ fontSize: "var(--text-hero)" }} className="font-bold leading-tight">{displayName}</h1>
        <p className="mt-4 text-lg" style={{ color: "hsl(var(--lp-muted))" }}>{t("lpHeroSubtitle")}</p>
        <FloatingButton href="#contact" size="lg" className="mt-8">{t("lpHeroCta")}</FloatingButton>
      </GlassCard>
    </FadeInUp>
  );
}
