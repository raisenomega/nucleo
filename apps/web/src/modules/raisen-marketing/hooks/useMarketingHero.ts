import { useEffect, useState } from "react";
import { getMarketingHero } from "@raisen-marketing/infrastructure/marketing-hero.repository";
import type { MarketingHeroRow } from "@raisen-marketing/data/hero.types";

// Lee la fila única de marketing_hero al montar (sin polling · above-the-fold: el visitante ve lo que
// había al cargar). null hasta que resuelve → el hero renderiza con el copy fallback mientras tanto.
export function useMarketingHero() {
  const [hero, setHero] = useState<MarketingHeroRow | null>(null);
  useEffect(() => { void getMarketingHero().then(setHero); }, []);
  return hero;
}
