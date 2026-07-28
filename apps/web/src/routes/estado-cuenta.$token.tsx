import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getStatementByToken, type PublicStatementResp } from "@shared/customers/customer-statement.repository";
import { PublicStatementView } from "@shared/customers/PublicStatementView";

export const Route = createFileRoute("/estado-cuenta/$token")({ component: PublicStatementPage });

// Página pública (sin auth): el cliente ve su estado de cuenta branded por token. Enlazada desde el WhatsApp.
function PublicStatementPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicStatementResp | null>(null);
  useEffect(() => { void getStatementByToken(token).then(setData); }, [token]);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicStatementView data={data} />;
}
