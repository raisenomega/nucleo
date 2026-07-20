import { useEffect, useState } from "react";
import { getSolutionsConfig, getSolutions } from "@raisen-marketing/infrastructure/marketing-solutions.repository";
import type { SolutionRow, SolutionsConfig } from "@raisen-marketing/data/solution.types";

// Lee la config + los bloques activos (ordenados) al montar. null hasta resolver → usa el fallback.
export function useMarketingSolutions() {
  const [config, setConfig] = useState<SolutionsConfig | null>(null);
  const [solutions, setSolutions] = useState<SolutionRow[] | null>(null);
  useEffect(() => {
    void getSolutionsConfig().then(setConfig);
    void getSolutions(true).then(setSolutions);
  }, []);
  return { config, solutions };
}
