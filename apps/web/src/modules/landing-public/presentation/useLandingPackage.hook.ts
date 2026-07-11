import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { PackageDetail } from "@landing-public/domain/landing-package-detail.types";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

type Data = { pkg: PackageDetail; related: HomePackage[] } | null;
type Status = "loading" | "ready" | "notfound" | "error";
const cache = new Map<string, Data>();

// Fetch _public_get_landing_package(host, slug) — includeds ya expandidos server-side. Cache por (host|slug).
export function useLandingPackage(slug: string) {
  const [data, setData] = useState<Data>(null);
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    if (cache.has(key)) { const v = cache.get(key) ?? null; setData(v); setStatus(v ? "ready" : "notfound"); return; }
    void supabase.rpc("_public_get_landing_package", { _hostname: window.location.hostname, _package_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; package?: PackageDetail; related?: HomePackage[] } | null;
      if (error || !r) return setStatus("error");
      if (r.status === "error") { if (r.code === "not_found") { cache.set(key, null); setStatus("notfound"); } else setStatus("error"); return; }
      const v = { pkg: r.package as PackageDetail, related: r.related ?? [] }; cache.set(key, v); setData(v); setStatus("ready");
    });
  }, [slug]);
  return { data, status };
}
