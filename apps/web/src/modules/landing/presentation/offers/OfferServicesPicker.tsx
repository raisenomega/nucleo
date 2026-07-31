import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { OfferInput } from "@landing/domain/landing-offer.types";
import type { SetOffer } from "@landing/presentation/offers/useOfferForm.hook";

// Multi-select de servicios aplicables (checkboxes). La oferta aplica solo a estos servicios.
export function OfferServicesPicker({ c, set }: { c: OfferInput; set: SetOffer }) {
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    void supabase.from("tenant_landing_services").select("id,name").eq("is_published", true)
      .then(({ data }) => setServices((data as { id: string; name: string }[] | null) ?? []));
  }, []);
  const toggle = (id: string) => set({
    applicableServices: c.applicableServices.includes(id)
      ? c.applicableServices.filter((s) => s !== id) : [...c.applicableServices, id],
  });
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-muted-foreground">Servicios aplicables</p>
      <div className="space-y-1 rounded-lg border border-border p-2">
        {services.length === 0 && <p className="text-xs text-muted-foreground">No hay servicios publicados.</p>}
        {services.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={c.applicableServices.includes(s.id)} onChange={() => toggle(s.id)} />{s.name}
          </label>
        ))}
      </div>
    </div>
  );
}
