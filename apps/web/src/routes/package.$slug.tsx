import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { PackageDetailPage } from "@landing-public/presentation/detail/PackageDetailPage";

export const Route = createFileRoute("/package/$slug")({ component: Page });

function Page() {
  const { slug } = Route.useParams();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><PackageDetailPage slug={slug} /></PublicBrandProvider>;
}
