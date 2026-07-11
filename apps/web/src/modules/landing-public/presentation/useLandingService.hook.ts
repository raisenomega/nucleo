import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { ServiceDetail } from "@landing-public/domain/landing-service-detail.types";
import type { HomeService } from "@landing-public/domain/landing-home.types";

type Data = { service: ServiceDetail; related: HomeService[] } | null;
type Status = "loading" | "ready" | "notfound" | "error";
const cache = new Map<string, Data>();

// Fetch _public_get_landing_service(host, slug). Cache por (host|slug). notfound si code='not_found'.
export function useLandingService(slug: string) {
  const [data, setData] = useState<Data>(null);
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    if (cache.has(key)) { const v = cache.get(key) ?? null; setData(v); setStatus(v ? "ready" : "notfound"); return; }
    void supabase.rpc("_public_get_landing_service", { _hostname: window.location.hostname, _service_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; service?: ServiceDetail; related?: HomeService[] } | null;
      if (error || !r) return setStatus("error");
      if (r.status === "error") { if (r.code === "not_found") { cache.set(key, null); setStatus("notfound"); } else setStatus("error"); return; }
      const v = { service: r.service as ServiceDetail, related: r.related ?? [] }; cache.set(key, v); setData(v); setStatus("ready");
    });
  }, [slug]);
  return { data, status };
}
