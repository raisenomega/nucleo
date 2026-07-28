import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getInvoiceByToken, type PublicInvoiceResp } from "@billing/infrastructure/supabase-invoice-share.repository";
import { PublicInvoiceView } from "@billing/presentation/PublicInvoiceView";

export const Route = createFileRoute("/factura/$token")({ component: PublicInvoicePage });

// Página pública (sin auth): el cliente ve su factura branded por token. Enlazada desde el WhatsApp.
function PublicInvoicePage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<PublicInvoiceResp | null>(null);
  useEffect(() => { void getInvoiceByToken(token).then(setData); }, [token]);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicInvoiceView data={data} />;
}
