import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Carrusel 4:5: 1 imagen visible + prev/next + dots. Swipe táctil + flechas de teclado. 1 img → sin controles.
export function ItemGalleryCarousel({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const start = useRef(0);
  if (images.length === 0) return <div className="aspect-[4/5] w-full rounded-xl bg-[color:hsl(var(--lp-muted))]/10" />;
  const go = (d: number) => setI((v) => (v + d + images.length) % images.length);
  const btn = "absolute top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70";
  return (
    <div className="relative" role="group" aria-roledescription="carousel" aria-label={alt} tabIndex={images.length > 1 ? 0 : -1}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
      onTouchStart={(e) => { start.current = e.touches[0]?.clientX ?? 0; }}
      onTouchEnd={(e) => { const x = e.changedTouches[0]?.clientX; if (x == null) return; const dx = x - start.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
      <img src={images[i]} alt={`${alt} ${i + 1}`} width={640} height={800} className="aspect-[4/5] w-full rounded-xl object-cover" />
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={t("lpCarouselPrev")} className={`${btn} left-2`}><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => go(1)} aria-label={t("lpCarouselNext")} className={`${btn} right-2`}><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/50"}`} />)}
          </div>
        </>)}
    </div>
  );
}
