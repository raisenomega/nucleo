import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { ItemHighlightsChecklist } from "@landing-public/presentation/popup/ItemHighlightsChecklist";
import type { LandingHeroSection } from "@landing-public/domain/landing-hero.types";

// Hero secundario split: imagen 4:5 (izq) + título/subtítulo/descripción/features + un único botón "Ver más" que
// navega a la página dedicada /servicios/{slug}. Stack en mobile.
export function LandingHeroSplit({ s }: { s: LandingHeroSection }) {
  const { locale } = useI18n();
  const nav = useNavigate();
  const pick = (es: string, en: string) => (locale === "en" ? en : es);
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[color:hsl(var(--lp-muted))]/10">
          {s.imageUrl && (/\.(mp4|webm|mov)$/i.test(s.imageUrl)
            ? <video src={s.imageUrl} autoPlay muted loop playsInline aria-label={pick(s.titleEs, s.titleEn)} className="h-full w-full object-cover" />
            : <img src={s.imageUrl} alt={pick(s.titleEs, s.titleEn)} width={640} height={800} loading="lazy" className="h-full w-full object-cover" />)}
        </div>
        <div className="space-y-4">
          <h2 style={{ fontSize: "var(--text-h2)" }} className="font-bold">{pick(s.titleEs, s.titleEn)}</h2>
          <p className="font-medium text-[color:hsl(var(--lp-fg))]">{pick(s.subtitleEs, s.subtitleEn)}</p>
          <p className="text-sm text-[color:hsl(var(--lp-muted))]">{pick(s.descriptionEs, s.descriptionEn)}</p>
          <ItemHighlightsChecklist highlights={s.features} />
          {s.linkTargetSlug && (
            <button type="button" onClick={() => void nav({ to: "/servicios/$slug", params: { slug: s.linkTargetSlug! } })}
              className="mt-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground">{pick(s.linkLabelEs, s.linkLabelEn) || pick("Ver más", "View more")}</button>
          )}
        </div>
      </div>
    </section>
  );
}
