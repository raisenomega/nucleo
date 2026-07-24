import { createFileRoute, notFound } from "@tanstack/react-router";
import { currentHost } from "@shared/seo/host";
import { getCampaignPage } from "@campaigns/infrastructure/campaigns-public.repository";
import { CampaignPageView } from "@campaigns/presentation/CampaignPageView";
import type { CampaignPageData } from "@campaigns/domain/campaign.types";

// Head white-label: se arma desde los seo_* de la página, SIN marca NÚCLEO (una campaña de tenant no debe emitir
// nada de NÚCLEO en su dominio). Canonical/OG completos llegan en R4 (SEO); R1 entrega title+description+og básicos.
function campaignHead(data: CampaignPageData | null) {
  if (!data) return {};
  const p = data.page; const title = p.seoTitle ?? p.name; const desc = p.seoDescription ?? "";
  const meta: Record<string, string>[] = [
    { title }, { name: "description", content: desc },
    { property: "og:title", content: title }, { property: "og:description", content: desc },
    { property: "og:type", content: "website" }, { name: "robots", content: p.isPublished ? "index, follow" : "noindex" },
  ];
  if (p.ogImageUrl) meta.push({ property: "og:image", content: p.ogImageUrl });
  return { meta };
}

// Ruta pública SSR ACOTADA: el loader corre server-side y solo lee page+blocks+tema (no toca PublicLandingRoot).
export const Route = createFileRoute("/c/$slug")({
  validateSearch: (s: Record<string, unknown>): { preview: boolean } => ({ preview: s.preview === true || s.preview === "true" }),
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ params, deps }) => {
    const data = await getCampaignPage(currentHost(), params.slug, deps.preview);
    if (!data && !deps.preview) throw notFound(); // publicada inexistente → 404 real (crawlers)
    return { data, preview: deps.preview, slug: params.slug };
  },
  head: ({ loaderData }) => campaignHead(loaderData?.data ?? null),
  component: Page,
});

function Page() {
  const { data, preview, slug } = Route.useLoaderData();
  return <CampaignPageView initial={data} preview={preview} slug={slug} />;
}
