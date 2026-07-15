import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";

const CTA_HREF: Record<string, string> = { quote: "#quote", order: "#order", contact: "#contact" };

// Hero flat: título/subtítulo/CTA reales del config. El título cae a display_name si está vacío; el subtítulo y el
// botón CTA se OCULTAN cuando su campo está vacío (así el owner los controla desde Ajustes del sitio).
export function HeroFlat({ hero, displayName }: { hero: Record<string, unknown> | null; displayName: string }) {
  const title = (hero?.hero_title as string) || displayName;
  const subtitle = ((hero?.hero_subtitle as string) ?? "").trim();
  const ctaLabel = ((hero?.hero_cta_label as string) ?? "").trim();
  const ctaType = (hero?.hero_cta_type as string) || "contact";
  const href = ctaType === "custom" ? ((hero?.hero_cta_href as string) || "#contact") : (CTA_HREF[ctaType] || "#contact");
  return (
    <FadeInUp className="text-center">
      <h1 style={{ fontSize: "var(--text-hero)" }} className="font-bold leading-tight text-white drop-shadow-lg">{title}</h1>
      {subtitle && <p style={{ fontSize: "var(--text-h2)" }} className="mx-auto mt-4 max-w-2xl text-white/90 drop-shadow">{subtitle}</p>}
      {ctaLabel && <FloatingButton href={href} variant="primary" size="lg" className="mt-8">{ctaLabel}</FloatingButton>}
    </FadeInUp>
  );
}
