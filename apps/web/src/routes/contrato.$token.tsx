import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { noindexHead } from "@shared/seo/noindex-head";
import { getContractByToken, type PublicContractResp } from "@orders/infrastructure/supabase-contract-share.repository";
import { PublicContractView } from "@orders/presentation/PublicContractView";

export const Route = createFileRoute("/contrato/$token")({ component: PublicContractPage, head: noindexHead });

// v2a.5 · Página pública (sin auth): el firmante ve su contrato branded por token. INFRA DORMIDA — nadie
// enlaza aquí todavía; v2a.6 la enciende (email + WhatsApp tras aceptar). noindexHead cierra el indexado:
// robots.txt evita el rastreo, pero sin el meta Google puede listar la URL si alguien la enlaza desde fuera.
// Fetch en useEffect (no en loader) a propósito: así el snapshot del contrato NUNCA pasa por el HTML de SSR,
// que es cacheable en la CDN — un documento por token no debe poder quedarse pegado en una caché compartida.
function PublicContractPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicContractResp | null>(null);
  useEffect(() => { void getContractByToken(token).then(setData); }, [token]);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicContractView data={data} />;
}
