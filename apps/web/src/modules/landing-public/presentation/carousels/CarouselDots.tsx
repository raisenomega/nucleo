// Indicadores de página, solo mobile (md:hidden). Click → salta a esa página.
export function CarouselDots({ pages, index, onGo }: { pages: number; index: number; onGo: (p: number) => void }) {
  return (
    <div className="mt-4 flex justify-center gap-2 md:hidden">
      {Array.from({ length: pages }).map((_, p) => (
        <button key={p} type="button" onClick={() => onGo(p)} aria-label={`${p + 1}`} aria-current={p === index}
          className={`rounded-full transition-all ${p === index ? "h-2 w-2 bg-[color:hsl(var(--tenant-accent-hsl))]" : "h-1.5 w-1.5 bg-[color:hsl(var(--lp-muted))]/40"}`} />
      ))}
    </div>
  );
}
