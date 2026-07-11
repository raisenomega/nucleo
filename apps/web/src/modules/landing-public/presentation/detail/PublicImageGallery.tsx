import { useState } from "react";

// Galería: imagen principal grande (eager) + thumbnails clickeables (lazy). Sin lightbox (follow-up).
export function PublicImageGallery({ primaryUrl, gallery, alt }: { primaryUrl: string | null; gallery: string[]; alt: string }) {
  const all = [primaryUrl, ...gallery].filter((u): u is string => !!u);
  const [active, setActive] = useState(0);
  if (all.length === 0) return <div className="aspect-square w-full rounded-xl bg-[color:hsl(var(--lp-muted))]/10" />;
  return (
    <div>
      <img src={all[active]} alt={alt} width={800} height={800} className="aspect-square w-full rounded-xl object-cover" />
      {all.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {all.map((u, i) => (
            <button key={i} type="button" onClick={() => setActive(i)} aria-label={`${alt} ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-[color:hsl(var(--tenant-accent-hsl))]" : "border-transparent"}`}>
              <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>))}
        </div>)}
    </div>
  );
}
