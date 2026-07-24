import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { downloadLeadsCsv } from "@shared/lib/lead-csv";
import { listCampaignPages } from "@campaigns/infrastructure/campaigns-admin.repository";
import type { Lead } from "@crm/domain/lead.types";

// R6 · export de los leads del tenant a CSV (cliente). Resuelve el nombre de la campaña de origen (campaign_page_id).
export function LeadsCsvButton({ leads }: { leads: readonly Lead[] }) {
  const [camps, setCamps] = useState<Record<string, string>>({});
  useEffect(() => { void listCampaignPages(true).then((c) => setCamps(Object.fromEntries(c.map((x) => [x.id, x.name])))); }, []);
  const run = () => downloadLeadsCsv(leads.map((l) => { const a = l.attribution ?? {}; return {
    date: l.createdAt.slice(0, 10), name: l.contactName, email: l.email, phone: l.phone,
    campaign: l.campaignPageId ? camps[l.campaignPageId] ?? "" : "", utmSource: a.utm_source ?? "",
    utmMedium: a.utm_medium ?? "", utmCampaign: a.utm_campaign ?? "", fbclid: a.fbclid ?? "", gclid: a.gclid ?? "", status: l.status }; }),
    `leads-${new Date().toISOString().slice(0, 10)}.csv`);
  return <button type="button" onClick={run} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-body"><Download className="h-4 w-4" /> CSV</button>;
}
