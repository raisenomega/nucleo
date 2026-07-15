import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { ServicePageLayout } from "@landing-public/presentation/service-pages/ServicePageLayout";

export const Route = createFileRoute("/servicios/$slug")({ component: Page });

function Page() {
  const { slug } = Route.useParams();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><ServicePageLayout slug={slug} /></PublicBrandProvider>;
}
