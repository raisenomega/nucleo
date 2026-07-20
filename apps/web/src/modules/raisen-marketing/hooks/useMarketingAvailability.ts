import { useEffect, useState } from "react";
import { getAvailabilityConfig, getBlockedDates } from "@raisen-marketing/infrastructure/marketing-availability.repository";
import type { AvailabilityConfig } from "@raisen-marketing/data/reservation.types";

// Config + fechas bloqueadas para el calendario público de /demo (lectura pública).
export function useMarketingAvailability() {
  const [config, setConfig] = useState<AvailabilityConfig | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);
  useEffect(() => {
    void getAvailabilityConfig().then(setConfig);
    void getBlockedDates().then((b) => setBlocked(b.map((x) => x.blockedDate)));
  }, []);
  return { config, blocked };
}
