import { useEffect, useState } from "react";
import { getProcessConfig, getProcessSteps } from "@raisen-marketing/infrastructure/marketing-process.repository";
import type { ProcessStepRow, ProcessConfig } from "@raisen-marketing/data/process.types";
import { useLandingSsr } from "@raisen-marketing/data/landing-data.context";

// Lee la config + los pasos activos (ordenados) al montar. null hasta resolver → la sección usa el fallback.
// `ssr` = snapshot del loader (SSR). Si viene sembrado, NO se refetchea: el primer render de cliente
// usa exactamente lo mismo que el servidor, así no hay hydration mismatch.
export function useMarketingProcess() {
  const ssr = useLandingSsr();
  const [config, setConfig] = useState<ProcessConfig | null>(ssr?.processConfig ?? null);
  const [steps, setSteps] = useState<ProcessStepRow[] | null>(ssr?.processSteps ?? null);
  useEffect(() => {
    if (ssr) return; // sembrado por el SSR
    void getProcessConfig().then(setConfig);
    void getProcessSteps(true).then(setSteps);
  }, [ssr]);
  return { config, steps };
}
