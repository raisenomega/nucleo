import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { noindexHead } from "@shared/seo/noindex-head";
import { getDeliveryByToken, type PublicDeliveryResp } from "@sales/infrastructure/supabase-delivery-share.repository";
import { PublicDeliveryView } from "@sales/presentation/PublicDeliveryView";

export const Route = createFileRoute("/entrega/$token")({ component: PublicDeliveryPage, head: noindexHead });

// Página pública (sin auth): el cliente ve su nota de entrega branded por token. Enlazada desde el WhatsApp.
function PublicDeliveryPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicDeliveryResp | null>(null);
  useEffect(() => { void getDeliveryByToken(token).then(setData); }, [token]);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicDeliveryView data={data} />;
}
