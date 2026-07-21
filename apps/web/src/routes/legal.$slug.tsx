import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { legalHead } from "@shared/seo/marketing.head";

// Ruta PÚBLICA (sin login) /legal/{slug} — páginas legales de la landing comercial. Lazy + aislada como la
// landing (marketing.css + react-markdown fuera del bundle del panel). Aesthetic landing (fondo oscuro).
const MarketingLegalPage = lazy(() => import("@raisen-marketing/components/legal/MarketingLegalPage"));

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => legalHead(params.slug),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><MarketingLegalPage slug={slug} /></Suspense>;
}
