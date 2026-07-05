import { useEffect, useState } from "react";
import type { IDashboardRepository, Snapshot } from "@finance/domain/dashboard.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useDashboard(repo: IDashboardRepository) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void repo.getSnapshot().then((s) => {
      setSnapshot(s);
      setIsLoading(false);
    });
  }, [repo]);

  return { snapshot, isLoading };
}
