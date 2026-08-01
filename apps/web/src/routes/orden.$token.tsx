import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { noindexHead } from "@shared/seo/noindex-head";
import { getOrderByToken, type PublicOrderResp } from "@orders/infrastructure/supabase-order-share.repository";
import { PublicOrderView } from "@orders/presentation/PublicOrderView";

export const Route = createFileRoute("/orden/$token")({ component: PublicOrderPage, head: noindexHead });

// Página pública (sin auth): el cliente ve su orden branded por token. Enlazada desde el WhatsApp.
function PublicOrderPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicOrderResp | null>(null);
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const paid = q.get("paid") === "1"; const subscribed = q.get("subscribed") === "1";
  // Tras el checkout de Stripe el cliente vuelve con ?paid=1 / ?subscribed=1; el webhook ya marcó la orden. Recargamos a los 5s.
  useEffect(() => {
    void getOrderByToken(token).then(setData);
    if (paid || subscribed) { const id = setTimeout(() => { void getOrderByToken(token).then(setData); }, 5000); return () => clearTimeout(id); }
  }, [token, paid, subscribed]);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicOrderView data={data} paid={paid} subscribed={subscribed} />;
}
