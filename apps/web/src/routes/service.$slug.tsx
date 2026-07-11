import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { ServiceDetailPage } from "@landing-public/presentation/detail/ServiceDetailPage";

export const Route = createFileRoute("/service/$slug")({ component: Page });

function Page() {
  const { slug } = Route.useParams();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><ServiceDetailPage slug={slug} /></PublicBrandProvider>;
}
