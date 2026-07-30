import { lazy, Suspense, useEffect } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { PublicLandingRoot } from "@landing-public/presentation/PublicLandingRoot";
import { landingHead } from "@shared/seo/marketing.head";
import { tenantLandingHead } from "@shared/seo/tenant.head";
import { fetchTenantSeo } from "@shared/seo/tenant-seo.repository";
import { getSeoData } from "@shared/seo/seo-data";
import { fetchLandingData } from "@raisen-marketing/infrastructure/landing-ssr.repository";
import { hostKind, currentHost } from "@shared/seo/host";

// Landing comercial de Raisen (marketing) — lazy: su chunk (marketing.css, three.js) no entra al bundle
// inicial del panel ni al de @landing-public. En SSR el módulo se precarga en el loader para que el HTML
// del servidor salga con el contenido ya renderizado.
const MarketingLanding = lazy(() => import("@raisen-marketing"));

export const Route = createFileRoute("/")({
  // La rama se decide AQUÍ, no en el componente. Antes se resolvía con useMounted (solo cliente), y por eso
  // el servidor entregaba un shell vacío: cero <h1>, cero <section>. Los crawlers de IA no ejecutan JS, así
  // que veían una página en blanco. Al decidirlo en el loader, servidor y cliente coinciden y "/" puede SSR-ear.
  loader: async () => {
    const kind = hostKind();
    // Dominio de tenant: en SSR redirige el apex a www (SEO: un solo host canónico) y siembra el <title>/meta
    // del tenant para que Google no indexe el default "Portal" del root. El cuerpo sigue client-only (three.js).
    if (kind === "tenant") {
      if (typeof window !== "undefined") return { kind, seo: null, landing: null, tenantSeo: null };
      const host = currentHost();
      if (/^[^.]+\.[^.]+$/.test(host)) throw redirect({ href: `https://www.${host}/`, statusCode: 301 });
      return { kind, seo: null, landing: null, tenantSeo: await fetchTenantSeo(host) };
    }
    if (kind !== "raisen") return { kind, seo: null, landing: null, tenantSeo: null };
    if (typeof window !== "undefined") return { kind, seo: null, landing: null, tenantSeo: null }; // en cliente los hooks fetchean solos
    // getSeoData alimenta el JSON-LD; fetchLandingData siembra TODAS las secciones. El import precarga el módulo lazy.
    const [seo, landing] = await Promise.all([getSeoData(), fetchLandingData(), import("@raisen-marketing")]);
    return { kind, seo, landing, tenantSeo: null };
  },
  head: ({ loaderData }) => (loaderData?.kind === "tenant" ? tenantLandingHead(loaderData?.tenantSeo) : landingHead(loaderData?.seo)),
  component: Home,
});

function Home() {
  const { kind, landing } = Route.useLoaderData();
  if (kind !== "raisen") return <NonRaisen panel={kind === "panel"} />;
  // El snapshot del loader siembra TODAS las secciones: sin él el servidor emitiría los fallbacks estáticos,
  // que ya se desincronizaron dos veces de la DB (precios en la S21, FAQ en la S23).
  return <Suspense fallback={null}><MarketingLanding ssr={landing} /></Suspense>;
}

// Ramas de tenant: se mantienen client-only a propósito. La landing white-label resuelve su marca por
// hostname contra la DB y no está preparada para SSR; meterla aquí sería arriesgar el sitio de un cliente
// por una mejora que le corresponde a su propia rodaja.
function NonRaisen({ panel }: { panel: boolean }) {
  const nav = useNavigate();
  const mounted = useMounted();
  useEffect(() => { if (mounted && panel) void nav({ to: "/login" }); }, [mounted, panel, nav]);
  if (!mounted) return <div className="min-h-screen bg-background" />;
  if (panel) return null; // redirigiendo a /login
  return <PublicBrandProvider><PublicLandingRoot /></PublicBrandProvider>;
}
