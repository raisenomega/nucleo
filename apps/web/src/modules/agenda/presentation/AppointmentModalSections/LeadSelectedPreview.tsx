import { Phone, Mail } from "lucide-react";
import type { LeadLite } from "@agenda/domain/leads-lite.types";

export function LeadSelectedPreview({ lead }: { lead: LeadLite }) {
  if (!lead.phone && !lead.email) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>}
      {lead.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
    </div>
  );
}
