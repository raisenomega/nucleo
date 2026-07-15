import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { ServicePage } from "@landing-public/domain/service-page.types";

type Raw = { slug: string; hero: unknown; uses: unknown; specs: unknown; faq: unknown; request_form: unknown; seo: unknown; is_active?: boolean };
type Status = "loading" | "ready" | "notfound";

// Fetch de la página. previewId (CEO) → _admin_get_service_page (bypass is_active); si no → _public_get_service_page.
export function useServicePage(slug: string, previewId?: string): { page: ServicePage | null; status: Status; isActive: boolean } {
  const [page, setPage] = useState<ServicePage | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const req = previewId
      ? supabase.rpc("_admin_get_service_page", { _page_id: previewId })
      : supabase.rpc("_public_get_service_page", { _hostname: window.location.hostname, _slug: slug });
    void req.then(({ data }) => {
      const d = data as Raw | null;
      if (!d) { setStatus("notfound"); return; }
      setPage({ slug: d.slug, hero: d.hero, uses: d.uses, specs: d.specs, faq: d.faq, requestForm: d.request_form, seo: d.seo } as ServicePage);
      setIsActive(d.is_active !== false); setStatus("ready");
    });
  }, [slug, previewId]);
  return { page, status, isActive };
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
