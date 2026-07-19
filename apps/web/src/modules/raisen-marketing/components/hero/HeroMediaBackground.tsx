import { HeroBackground } from "@raisen-marketing/components/hero-scene/HeroBackground";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";

// Fondo del hero (fixed z-0). Precedencia: video > imagen > escena 3D > fondo oscuro. Overlay oscuro sobre
// el media (media_overlay_opacity). El toggle show_3d_scene solo aplica cuando NO hay video/imagen.
export function HeroMediaBackground({ hero }: { hero: MarketingHeroRow | null }) {
  const media = hero?.backgroundVideoUrl ? "video" : hero?.backgroundImageUrl ? "image" : null;
  if (media) {
    const overlay = <div className="absolute inset-0 bg-black" style={{ opacity: hero!.mediaOverlayOpacity }} />;
    return (
      <div className="fixed inset-0 z-0 overflow-hidden bg-black">
        {media === "video"
          ? <video src={hero!.backgroundVideoUrl!} autoPlay loop muted playsInline className="h-full w-full object-cover" />
          : <img src={hero!.backgroundImageUrl!} alt="" className="h-full w-full object-cover" />}
        {overlay}
      </div>
    );
  }
  if (hero?.show3dScene ?? true) return <HeroBackground />;
  return <div className="fixed inset-0 z-0" style={{ background: "hsl(225 15% 5%)" }} />;
}
