import { useCallback, useEffect, useState } from "react";
import type { IOnboardingRepository, OnboardingChecklist, OnboardingTemplate } from "@hr/domain/onboarding.types";

// DI del repo. Lista de onboardings activos + templates (vista staff).
export function useOnboarding(repo: IOnboardingRepository) {
  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const load = useCallback(async () => {
    const [c, t] = await Promise.all([repo.listChecklists(), repo.listTemplates()]);
    setChecklists(c); setTemplates(t);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  return { checklists, templates, refresh: load };
}
