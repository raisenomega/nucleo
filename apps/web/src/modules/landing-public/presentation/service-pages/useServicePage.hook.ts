import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { ServicePage } from "@landing-public/domain/service-page.types";

type Raw = { slug: string; hero: unknown; uses: unknown; specs: unknown; faq: unknown; request_form: unknown; seo: unknown };
type Status = "loading" | "ready" | "notfound";

// Fetch _public_get_service_page(host, slug). null → notfound.
export function useServicePage(slug: string): { page: ServicePage | null; status: Status } {
  const [page, setPage] = useState<ServicePage | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    if (typeof window === "undefined") return;
    void supabase.rpc("_public_get_service_page", { _hostname: window.location.hostname, _slug: slug }).then(({ data }) => {
      const d = data as Raw | null;
      if (!d) { setStatus("notfound"); return; }
      setPage({ slug: d.slug, hero: d.hero, uses: d.uses, specs: d.specs, faq: d.faq, requestForm: d.request_form, seo: d.seo } as ServicePage);
      setStatus("ready");
    });
  }, [slug]);
  return { page, status };
}

// Crea el lead desde el form request de la página.
export function useCreateServiceRequest(slug: string) {
  const [busy, setBusy] = useState(false);
  async function submit(payload: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    const { data } = await supabase.rpc("_public_create_service_request", { _hostname: window.location.hostname, _slug: slug, _payload: payload, _client_ip: null });
    setBusy(false);
    return (data as { status?: string } | null)?.status === "ok";
  }
  return { busy, submit };
}
