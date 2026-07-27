import { createFileRoute } from "@tanstack/react-router";
import { PublicOpeningPage } from "@hr/presentation/PublicOpeningPage";

export const Route = createFileRoute("/apply/$token")({ component: Page });

// Ruta PÚBLICA (sin auth): el candidato aplica a la vacante por su public_token.
function Page() {
  const { token } = Route.useParams();
  return <PublicOpeningPage token={token} />;
}
