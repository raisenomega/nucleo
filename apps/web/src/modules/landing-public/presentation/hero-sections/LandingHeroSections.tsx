import { useLandingHeroSections } from "@landing-public/presentation/hero-sections/useLandingHeroSections.hook";
import { LandingHeroSplit } from "@landing-public/presentation/hero-sections/LandingHeroSplit";

// Renderiza todas las secciones hero activas del tenant (Hydro-Jet hoy; reusable para Modelo Comercial). Vacío → null.
export function LandingHeroSections() {
  const sections = useLandingHeroSections();
  if (sections.length === 0) return null;
  return <>{sections.map((s) => <LandingHeroSplit key={`${s.kind}-${s.id}`} s={s} />)}</>;
}
