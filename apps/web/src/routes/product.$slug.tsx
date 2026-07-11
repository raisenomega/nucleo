import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { ProductDetailPage } from "@landing-public/presentation/detail/ProductDetailPage";

export const Route = createFileRoute("/product/$slug")({ component: Page });

function Page() {
  const { slug } = Route.useParams();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><ProductDetailPage slug={slug} /></PublicBrandProvider>;
}
