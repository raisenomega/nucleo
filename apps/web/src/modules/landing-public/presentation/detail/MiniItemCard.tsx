import { Link } from "@tanstack/react-router";

// Mini-card de un item incluido en un paquete: img 48×48 + nombre + cantidad. Navega SPA al detail.
export function MiniItemCard({ imageUrl, name, qtyLabel, to, slug }: {
  imageUrl: string | null; name: string; qtyLabel: string; to: "/product/$slug" | "/service/$slug"; slug: string;
}) {
  return (
    <Link to={to} params={{ slug }} aria-label={name} className="flex items-center gap-3 rounded-lg border border-[color:var(--glass-border)] p-2 transition-colors hover:bg-black/5">
      {imageUrl
        ? <img src={imageUrl} alt="" loading="lazy" width={48} height={48} className="h-12 w-12 shrink-0 rounded object-cover" />
        : <div className="h-12 w-12 shrink-0 rounded bg-[color:hsl(var(--lp-muted))]/15" />}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-[color:hsl(var(--lp-muted))]">{qtyLabel}</p>
      </div>
    </Link>
  );
}
