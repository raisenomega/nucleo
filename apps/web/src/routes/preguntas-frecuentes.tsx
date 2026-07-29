import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPublicFaqs, type PublicFaqsResp } from "@landing-public/infrastructure/public-faqs.repository";
import { PublicFaqsView } from "@landing-public/presentation/PublicFaqsView";

export const Route = createFileRoute("/preguntas-frecuentes")({
  head: () => ({ meta: [{ title: "Preguntas frecuentes" }] }),
  component: PublicFaqsPage,
});

// Página pública (sin auth) con todas las FAQs del tenant, resuelto por hostname. Enlazada desde el landing.
function PublicFaqsPage() {
  const [data, setData] = useState<PublicFaqsResp | null>(null);
  useEffect(() => {
    void getPublicFaqs().then((d) => {
      setData(d);
      if (d.status === "valid" && d.tenant?.display_name) document.title = `Preguntas frecuentes | ${d.tenant.display_name}`;
    });
  }, []);
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-background p-4 text-muted-foreground">…</main>;
  return <PublicFaqsView data={data} />;
}
