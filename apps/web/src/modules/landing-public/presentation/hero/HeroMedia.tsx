import { useReducedMotion } from "@landing-public/utils/reduced-motion";
import { HeroGradientMedia } from "@landing-public/presentation/hero/HeroGradientMedia";

// Media del hero: video (autoplay muted loop) si hay y sin reduced-motion; si no, imagen; si no, gradiente.
// Scrim bg-black/40 encima para legibilidad del texto flat.
export function HeroMedia({ videoUrl, imageUrl }: { videoUrl: string | null; imageUrl: string | null }) {
  const reduced = useReducedMotion();
  const cls = "absolute inset-0 h-full w-full object-cover";
  if (videoUrl && !reduced) return (
    <div className="relative h-full w-full">
      <video autoPlay muted loop playsInline poster={imageUrl ?? undefined} src={videoUrl} className={cls} />
      <div className="absolute inset-0 bg-black/40" />
    </div>);
  if (imageUrl) return (
    <div className="relative h-full w-full">
      <img src={imageUrl} alt="" className={cls} /><div className="absolute inset-0 bg-black/40" />
    </div>);
  return <HeroGradientMedia />;
}
