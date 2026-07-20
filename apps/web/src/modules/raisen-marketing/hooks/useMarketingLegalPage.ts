import { useEffect, useState } from "react";
import { getLegalPage } from "@raisen-marketing/infrastructure/marketing-legal.repository";
import type { LegalPageRow } from "@raisen-marketing/data/legal.types";

// Lee una página legal por slug (ruta pública /legal/{slug}). loading distingue "cargando" de "no existe".
export function useMarketingLegalPage(slug: string) {
  const [page, setPage] = useState<LegalPageRow | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    void getLegalPage(slug).then((p) => { setPage(p); setLoading(false); });
  }, [slug]);
  return { page, loading };
}
