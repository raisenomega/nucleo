import { useEffect, useState } from "react";
import { getProcessConfig, getProcessSteps } from "@raisen-marketing/infrastructure/marketing-process.repository";
import type { ProcessStepRow, ProcessConfig } from "@raisen-marketing/data/process.types";

// Lee la config + los pasos activos (ordenados) al montar. null hasta resolver → la sección usa el fallback.
export function useMarketingProcess() {
  const [config, setConfig] = useState<ProcessConfig | null>(null);
  const [steps, setSteps] = useState<ProcessStepRow[] | null>(null);
  useEffect(() => {
    void getProcessConfig().then(setConfig);
    void getProcessSteps(true).then(setSteps);
  }, []);
  return { config, steps };
}
