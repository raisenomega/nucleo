import { useEffect, useState } from "react";
import { getMarketingHero } from "@raisen-marketing/infrastructure/marketing-hero.repository";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la fila única de marketing_hero al montar (sin polling · above-the-fold: el visitante ve lo que
// había al cargar). null hasta que resuelve → el hero renderiza con el copy fallback mientras tanto.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingHero() {
  const ssr = useLandingSsr();
  const [hero, setHero] = useState<MarketingHeroRow | null>(ssr?.hero ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getMarketingHero().then(setHero);
  }, [ssr]);
  return hero;
}
