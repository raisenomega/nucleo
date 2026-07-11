import { useI18n } from "@shared/i18n";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { MotionProvider } from "@landing-public/motion/motion-loader";
import { HeroContainer } from "@landing-public/primitives/HeroContainer";
import { HeroMedia } from "@landing-public/presentation/hero/HeroMedia";
import { HeroFlat } from "@landing-public/presentation/hero/HeroFlat";
import { PublicNav } from "@landing-public/presentation/nav/PublicNav";
import { useLandingHome } from "@landing-public/presentation/useLandingHome.hook";
import { HomeSections } from "@landing-public/presentation/HomeSections";
import { ContactSection } from "@landing-public/presentation/sections/ContactSection";
import { PublicFooter } from "@landing-public/presentation/footer/PublicFooter";

// Home pública (3.E.3): hero data-driven full-screen (config real vía _public_get_landing_home).
export function PublicLandingRoot() {
  const { t } = useI18n();
  const s = usePublicBrand();
  const home = useLandingHome();
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
  const hero = home?.hero ?? null;
  return (
    <MotionProvider>
      <div className="lp-root min-h-screen">
        <PublicNav displayName={s.brand.displayName} logoUrl={s.brand.logoUrl} />
        <HeroContainer mediaSlot={<HeroMedia videoUrl={(hero?.hero_video_url as string) ?? null} imageUrl={(hero?.hero_image_url as string) ?? null} />}>
          <HeroFlat hero={hero} displayName={s.brand.displayName} />
        </HeroContainer>
        <HomeSections home={home} />
        <ContactSection />
        <PublicFooter brand={s.brand} tagline={(hero?.meta_description as string) ?? ""} />
      </div>
    </MotionProvider>
  );
}
