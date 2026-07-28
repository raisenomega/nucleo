import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getOrderByToken, type PublicOrderResp } from "@orders/infrastructure/supabase-order-share.repository";
import { PublicOrderView } from "@orders/presentation/PublicOrderView";

export const Route = createFileRoute("/orden/$token")({ component: PublicOrderPage });

// Página pública (sin auth): el cliente ve su orden branded por token. Enlazada desde el WhatsApp.
function PublicOrderPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicOrderResp | null>(null);
  useEffect(() => { void getOrderByToken(token).then(setData); }, [token]);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicOrderView data={data} />;
}
