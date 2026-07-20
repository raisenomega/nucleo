import { useEffect, useState } from "react";
import { getSlots } from "@raisen-marketing/infrastructure/marketing-booking.repository";

// Slots disponibles de la fecha seleccionada (RPC). Se recomputa al cambiar la fecha.
export function useMarketingSlots(dateStr: string | null) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!dateStr) { setSlots([]); return; }
    setLoading(true);
    void getSlots(dateStr).then((s) => { setSlots(s); setLoading(false); });
  }, [dateStr]);
  return { slots, loading };
}
