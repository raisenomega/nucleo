import { useI18n } from "@shared/i18n";
import type { Lead } from "@crm/domain/lead.types";

// Detalles estructurados de una solicitud (custom_fields ya resueltos a labels). Vacío → no renderiza.
export function LeadServiceRequestBlock({ lead }: { lead: Lead }) {
  const { t } = useI18n();
  if (lead.customFields.length === 0) return null;
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 font-semibold text-foreground">{t("leadRequestDetails")}</h2>
      <div className="space-y-1.5">
        {lead.customFields.map((c, i) => (
          <div key={i} className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="max-w-[60%] text-right text-foreground">{c.value}</span>
          </div>))}
      </div>
    </section>
  );
}
