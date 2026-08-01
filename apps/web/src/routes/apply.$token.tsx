import { createFileRoute } from "@tanstack/react-router";
import { noindexHead } from "@shared/seo/noindex-head";
import { PublicOpeningPage } from "@hr/presentation/PublicOpeningPage";

export const Route = createFileRoute("/apply/$token")({ component: Page, head: noindexHead });

// Ruta PÚBLICA (sin auth): el candidato aplica a la vacante por su public_token.
function Page() {
  const { token } = Route.useParams();
  return <PublicOpeningPage token={token} />;
}
