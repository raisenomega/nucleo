const box = "rounded bg-[color:hsl(var(--lp-muted))]/15";

// Skeleton mínimo del layout detail (bg-pulse, sin librería). Evita pantalla blanca mientras carga la RPC.
export function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl animate-pulse grid-cols-1 gap-8 px-6 pt-10 md:grid-cols-2">
      <div className={`aspect-square w-full ${box}`} />
      <div className="space-y-4">
        <div className={`h-8 w-2/3 ${box}`} />
        <div className={`h-4 w-full ${box}`} />
        <div className={`h-4 w-1/2 ${box}`} />
        <div className={`h-11 w-44 ${box}`} />
      </div>
    </div>
  );
}
