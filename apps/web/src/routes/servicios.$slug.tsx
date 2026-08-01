import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { ServicePageLayout } from "@landing-public/presentation/service-pages/ServicePageLayout";

export const Route = createFileRoute("/servicios/$slug")({
  // `preview` sólo viaja si vino en la URL. Devolverla siempre (aunque fuera false) hacía que TanStack
  // redirigiera la URL limpia con 307 a ?preview=false, y Google la veía no indexable. Mismo patrón que
  // c.$slug.tsx:39. Ver memoria [[tanstack-validatesearch-redirect]].
  validateSearch: (s: Record<string, unknown>): { preview?: true; pid?: string } => ({
    ...(s.preview === true || s.preview === "true" ? { preview: true as const } : {}),
    ...(typeof s.pid === "string" ? { pid: s.pid } : {}),
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { preview, pid } = Route.useSearch();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><ServicePageLayout slug={slug} previewId={preview ? pid : undefined} /></PublicBrandProvider>;
}
