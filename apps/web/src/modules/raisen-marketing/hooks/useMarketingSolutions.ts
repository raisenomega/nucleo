import { useEffect, useState } from "react";
import { getSolutionsConfig, getSolutions } from "@raisen-marketing/infrastructure/marketing-solutions.repository";
import type { SolutionRow, SolutionsConfig } from "@raisen-marketing/data/solution.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la config + los bloques activos (ordenados) al montar. null hasta resolver → usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingSolutions() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<SolutionsConfig | null>(ssr?.solutionsConfig ?? null);
  const [solutions, setSolutions] = useState<SolutionRow[] | null>(ssr?.solutions ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getSolutionsConfig().then(setConfig);
    void getSolutions(true).then(setSolutions);
  }, [ssr]);
  return { config, solutions };
}
