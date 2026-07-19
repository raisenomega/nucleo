import { StarField } from "@raisen-marketing/components/background/StarField";
import { GradientOrbs } from "@raisen-marketing/components/background/GradientOrbs";
import { GridBackground } from "@raisen-marketing/components/background/GridBackground";

// Compone las 3 capas de fondo (grid + orbes + estrellas) en absolute -z-10.
export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <GridBackground />
      <GradientOrbs />
      <StarField />
    </div>
  );
}
