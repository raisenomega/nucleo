import { useI18n } from "@shared/i18n";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { MotionProvider } from "@landing-public/motion/motion-loader";
import { HeroContainer } from "@landing-public/primitives/HeroContainer";
import { HeroGradientMedia } from "@landing-public/presentation/hero/HeroGradientMedia";
import { HeroPlaceholder } from "@landing-public/presentation/hero/HeroPlaceholder";
import { PublicNav } from "@landing-public/presentation/nav/PublicNav";

// Home pública (3.E.2.d): hero placeholder end-to-end con primitives Glass Liquid + motion.
export function PublicLandingRoot() {
  const { t } = useI18n();
  const s = usePublicBrand();
  if (s.status === "loading") return <div className="min-h-screen bg-background" />;
  if (s.status === "fallback") {
    const bare = typeof window !== "undefined" ? window.location.hostname.replace(/^www\./, "") : "";
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-foreground">
        <h1 className="font-display text-2xl font-bold">{t("lpFallbackTitle")}</h1>
        <p className="max-w-md text-muted-foreground">{t("lpFallbackMsg")}</p>
        <a href={`https://app.${bare}`} className="rounded-lg bg-primary px-6 py-3 font-body font-bold text-primary-foreground">{t("lpGoToPanel")}</a>
      </main>
    );
  }
  return (
    <MotionProvider>
      <div className="lp-root min-h-screen">
        <PublicNav displayName={s.brand.displayName} logoUrl={s.brand.logoUrl} />
        <HeroContainer mediaSlot={<HeroGradientMedia />}>
          <HeroPlaceholder displayName={s.brand.displayName} />
        </HeroContainer>
      </div>
    </MotionProvider>
  );
}
