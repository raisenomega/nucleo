import { Skeleton } from "@shared/components/loading";

// Skeleton de la primera carga del catálogo: 6 cards (no 24, sería pesado). Composición del primitive.
export function CatalogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton variant="text" lines={2} />
        </div>))}
    </div>
  );
}
