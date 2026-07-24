import { createFileRoute, notFound } from "@tanstack/react-router";
import { currentHost } from "@shared/seo/host";
import { getCampaignPage } from "@campaigns/infrastructure/campaigns-public.repository";
import { CampaignPageView } from "@campaigns/presentation/CampaignPageView";
import type { CampaignPageData } from "@campaigns/domain/campaign.types";

type LD = { data: CampaignPageData | null; preview: boolean; slug: string; host: string };

// og:image cae al fondo del hero si no hay og_image_url propio.
function heroImage(d: CampaignPageData): string {
  const bg = d.blocks.find((b) => b.blockType === "hero")?.contentEs?.background_image_url;
  return typeof bg === "string" ? bg : "";
}

// Head white-label (SIN marca NÚCLEO). robots: publicada→index; preview o borrador→noindex (nunca indexar borradores).
function campaignHead(ld: LD | undefined) {
  if (!ld?.data) return {};
  const p = ld.data.page; const title = p.seoTitle ?? p.name; const desc = p.seoDescription ?? "";
  const canonical = `https://${ld.host}/c/${p.slug}`; const img = p.ogImageUrl || heroImage(ld.data);
  const robots = ld.preview || !p.isPublished ? "noindex, nofollow" : "index, follow";
  const meta: Record<string, string>[] = [
    { title }, { name: "description", content: desc }, { name: "robots", content: robots },
    { property: "og:type", content: "website" }, { property: "og:url", content: canonical },
    { property: "og:title", content: title }, { property: "og:description", content: desc },
    { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:title", content: title }, { name: "twitter:description", content: desc },
  ];
  if (img) { meta.push({ property: "og:image", content: img }); meta.push({ name: "twitter:image", content: img }); }
  return { meta, links: [{ rel: "canonical", href: canonical }] };
}

// Ruta pública SSR ACOTADA: el loader corre server-side y solo lee page+blocks+tema (no toca PublicLandingRoot).
export const Route = createFileRoute("/c/$slug")({
  validateSearch: (s: Record<string, unknown>): { preview: boolean } => ({ preview: s.preview === true || s.preview === "true" }),
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ params, deps }): Promise<LD> => {
    const data = await getCampaignPage(currentHost(), params.slug, deps.preview);
    if (!data && !deps.preview) throw notFound();
    return { data, preview: deps.preview, slug: params.slug, host: currentHost() };
  },
  head: ({ loaderData }) => campaignHead(loaderData),
  component: Page,
});

function Page() {
  const { data, preview, slug } = Route.useLoaderData();
  return <CampaignPageView initial={data} preview={preview} slug={slug} />;
}
