import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { ServiceDetailPage } from "@landing-public/presentation/detail/ServiceDetailPage";
import { loadTenantSeo, tenantPageHead, tenantOrigin } from "@shared/seo/tenant-page-head";
import { fetchLandingServiceSeo } from "@landing-public/infrastructure/service-seo.repository";

// Ficha estándar del servicio. Cuando el servicio tiene ADEMÁS página dedicada (`landing_hero` configurado
// desde el CMS, que se sirve en /servicios/{slug}), ESA es la canónica: es la pieza comercial completa y no
// tiene sentido que las dos compitan entre sí en Google. Si no la tiene, ésta es la única y no apunta a nadie.
export const Route = createFileRoute("/service/$slug")({
  loader: async ({ params }) => {
    const tenantSeo = await loadTenantSeo();
    const svc = tenantSeo ? await fetchLandingServiceSeo(params.slug) : null;
    return { tenantSeo, name: svc?.name ?? null, rica: svc?.tienePaginaRica ?? false };
  },
  head: ({ loaderData, params }) => {
    const origin = tenantOrigin(loaderData?.tenantSeo);
    const canonical = loaderData?.rica && origin ? `${origin}/servicios/${params.slug}` : null;
    return tenantPageHead(loaderData?.name ?? "Servicio", loaderData?.tenantSeo, canonical);
  },
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><ServiceDetailPage slug={slug} /></PublicBrandProvider>;
}
