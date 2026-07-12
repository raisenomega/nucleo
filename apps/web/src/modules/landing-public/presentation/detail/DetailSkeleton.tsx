import { Skeleton } from "@shared/components/loading";

// Skeleton del layout detail — composición del primitive <Skeleton> (REFACTOR-2). Evita pantalla blanca al cargar.
export function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 pt-10 md:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton variant="text" lines={2} />
        <Skeleton className="h-11 w-44" />
      </div>
    </div>
  );
}
